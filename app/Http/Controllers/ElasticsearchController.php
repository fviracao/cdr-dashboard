<?php

namespace App\Http\Controllers;

use App\Services\ElasticsearchService;
use Illuminate\Http\JsonResponse;

class ElasticsearchController extends Controller
{
    protected $elasticsearchService;

    public function __construct(ElasticsearchService $elasticsearchService)
    {
        $this->elasticsearchService = $elasticsearchService;
    }

    public function testConnection(): JsonResponse
    {
        $response = $this->elasticsearchService->testConnection();

        if ($response) {
            return response()->json($response); // Retorna o conteúdo diretamente
        } else {
            return response()->json(['status' => 'error', 'message' => 'Failed to connect to Elasticsearch.']);
        }
    }
}