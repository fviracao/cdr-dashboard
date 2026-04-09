<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\ElasticsearchService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    protected $es;
    protected $index;

    public function __construct(ElasticsearchService $es)
    {
        $this->es = $es;
        $this->index = config('elasticsearch.index', 'cdr_leg');
    }

    public function search(Request $req): JsonResponse
    {
        // Log da requisição completa
        \Log::debug('ReportController search - Request all:', $req->all());
        \Log::debug('ReportController search - Request input:', $req->input());

        $v = Validator::make($req->all(), [
            'size' => 'integer|min:0|max:10000',
            'from' => 'integer|min:0',
            'begin' => 'nullable|date',
            'end' => 'nullable|date',
            'record_type' => 'nullable|string',
            'called_number' => 'nullable|string',
            'calling_number' => 'nullable|string',
            'report_type' => 'nullable|string',
            'query' => 'nullable|array',
        ]);

        if ($v->fails()) {
            return response()->json(['error' => 'validation', 'messages' => $v->errors()], 422);
        }

        // Se a requisição já vem com query montada (do React)
        if ($req->has('query')) {
            \Log::debug('ReportController - Using pre-built query:', $req->all());
            
            $params = [
                'index' => $this->index,
                'body' => $req->all() // Envia tudo: size, from, query, _source, track_total_hits
            ];

            try {
                $resp = $this->es->search($params);
                return response()->json($resp);
            } catch (\Exception $e) {
                \Log::error('ReportController search error:', ['message' => $e->getMessage()]);
                return response()->json([
                    'error' => 'es_error',
                    'message' => $e->getMessage(),
                    'hits' => [
                        'total' => ['value' => 0],
                        'hits' => []
                    ]
                ], 500);
            }
        }

        // Se size=0 ou tem report_type, usa summary
        if ((string)$req->input('size') === '0' || $req->filled('report_type')) {
            try {
                $filters = $req->only(['begin', 'end', 'record_type', 'called_number', 'calling_number', 'report_type']);
                $resp = $this->es->summary($filters);
                return response()->json($resp);
            } catch (\Exception $e) {
                \Log::error('ReportController summary error:', ['message' => $e->getMessage()]);
                return response()->json([
                    'error' => 'es_error',
                    'message' => $e->getMessage(),
                    'hits' => [
                        'total' => ['value' => 0],
                        'hits' => []
                    ]
                ], 500);
            }
        }

        // Monta query manualmente se não veio pronta
        $size = (int) $req->input('size', 50);
        $from = (int) $req->input('from', 0);

        $filters = [];

        if ($req->filled('record_type')) {
            $filters[] = ['term' => ['record_type.keyword' => $req->record_type]];
        } else {
            $filters[] = ['term' => ['record_type.keyword' => 'END']];
        }

        if ($req->filled('called_number')) {
            $filters[] = ['wildcard' => ['called_number.keyword' => '*' . $req->called_number . '*']];
        }

        if ($req->filled('calling_number')) {
            $filters[] = ['wildcard' => ['calling_number.keyword' => '*' . $req->calling_number . '*']];
        }

        if ($req->filled('begin') || $req->filled('end')) {
            $range = [];
            if ($req->filled('begin')) {
                $range['gte'] = $req->begin;
            }
            if ($req->filled('end')) {
                $range['lte'] = $req->end;
            }
            $range['format'] = 'strict_date_optional_time||epoch_millis';
            $filters[] = ['range' => ['ts' => $range]];
        }

        $query = empty($filters) ? ['match_all' => (object)[]] : ['bool' => ['filter' => $filters]];

        $body = [
            'size' => $size,
            'from' => $from,
            'track_total_hits' => true,
            'query' => $query,
            '_source' => true,
        ];

        \Log::debug('ReportController - Built query:', $body);

        try {
            $resp = $this->es->search([
                'index' => $this->index,
                'body' => $body,
            ]);
            return response()->json($resp);
        } catch (\Exception $e) {
            \Log::error('ReportController search error:', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'es_error',
                'message' => $e->getMessage(),
                'hits' => [
                    'total' => ['value' => 0],
                    'hits' => []
                ]
            ], 500);
        }
    }

    public function summary(Request $req): JsonResponse
    {
        try {
            $filters = $req->all();
            
            \Log::debug('ReportController summary - Filters:', $filters);

            $resp = $this->es->summary($filters);
            
            return response()->json($resp);
        } catch (\Exception $e) {
            \Log::error('ReportController summary error:', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'es_error',
                'message' => $e->getMessage(),
                'hits' => [
                    'total' => ['value' => 0],
                    'hits' => []
                ]
            ], 500);
        }
    }

    public function count(Request $req): JsonResponse
    {
        $body = ['query' => ['match_all' => (object)[]]];
        try {
            $resp = $this->es->count(['index' => $this->index, 'body' => $body]);
            return response()->json($resp);
        } catch (\Exception $e) {
            \Log::error('ReportController count error:', ['message' => $e->getMessage()]);
            return response()->json([
                'error' => 'es_error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}