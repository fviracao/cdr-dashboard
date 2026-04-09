<?php

namespace App\Services;

use Elastic\Elasticsearch\Client;
use Elastic\Elasticsearch\ClientBuilder;
use Psr\Log\LoggerInterface;
use GuzzleHttp\HandlerStack;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

class ElasticsearchService
{
    /** @var Client */
    protected $client;

    /** @var LoggerInterface */
    protected $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;

        // Recupera configuração (garanta config/elasticsearch.php)
        $hosts = config('elasticsearch.hosts', ['http://199.59.96.167:9237']);
        if (is_string($hosts)) {
            $hosts = array_map('trim', explode(',', $hosts));
        }

        // Criar handler stack do Guzzle
        $handler = HandlerStack::create();

        // Middleware custom que usa $this->logger
        $loggerLocal = $this->logger;
        $handler->push(function (callable $next) use ($loggerLocal) {
            return function (RequestInterface $request, array $options) use ($next, $loggerLocal) {
                // log request (trunca body grande)
                $reqBody = (string) $request->getBody();
                if (strlen($reqBody) > 2000) {
                    $reqBody = substr($reqBody, 0, 2000) . '...(truncated)';
                }

                // Remove header Authorization para evitar logar credenciais
                $headers = $request->getHeaders();
                if (isset($headers['Authorization'])) {
                    $headers['Authorization'] = ['(redacted)'];
                }

                $loggerLocal->debug('ES.http.request', [
                    'method' => $request->getMethod(),
                    'uri' => (string) $request->getUri(),
                    'headers' => $headers,
                    'body' => $reqBody,
                ]);

                return $next($request, $options)->then(
                    function (ResponseInterface $response) use ($loggerLocal) {
                        $resBody = (string) $response->getBody();
                        if (strlen($resBody) > 2000) {
                            $resBody = substr($resBody, 0, 2000) . '...(truncated)';
                        }

                        $loggerLocal->debug('ES.http.response', [
                            'status' => $response->getStatusCode(),
                            'reason' => $response->getReasonPhrase(),
                            'headers' => $response->getHeaders(),
                            'body' => $resBody,
                        ]);
                        return $response;
                    },
                    function ($reason) use ($loggerLocal, $request) {
                        $msg = is_object($reason) && method_exists($reason, '__toString') ? (string)$reason : json_encode($reason);
                        $loggerLocal->error('ES.http.error', [
                            'reason' => $msg,
                            'request_uri' => (string) $request->getUri(),
                        ]);
                        return \GuzzleHttp\Promise\rejection_for($reason);
                    }
                );
            };
        }, 'es_logger');

        // Montar ClientBuilder com handler
        $builder = ClientBuilder::create()
            ->setHosts($hosts);

        $user = config('elasticsearch.user', null);
        $pass = config('elasticsearch.pass', null);
        if (!empty($user) && !empty($pass)) {
            $builder->setBasicAuthentication($user, $pass);
        }

        $builder->setRetries((int) config('elasticsearch.retries', 1));

        $this->client = $builder->build();
    }

    public function search(array $params)
    {
        \Log::debug('ES.request: search', $params);

        try {
            // Faz a busca no Elasticsearch
            $response = $this->client->search($params);
            
            \Log::debug('ES.raw_response: search', ['response' => $response]);

            // CONVERTE O OBJETO RESPONSE PARA ARRAY
            $result = $response->asArray();
            
            \Log::debug('ES.array_response: search', ['result' => $result]);

            return $result;

        } catch (\Exception $e) {
            \Log::error('ES.search error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function count(array $params): array
    {
        $this->logRequest('count', $params);
        if (!isset($params['client'])) {
            $params['client'] = [];
        }
        if (!isset($params['client']['timeout'])) {
            $params['client']['timeout'] = (int) config('elasticsearch.timeout', 60);
        }

        try {
            $response = $this->client->count($params);
            $this->logResponse('count', $params, $response);
            return is_array($response) ? $response : (array) $response;
        } catch (\Throwable $e) {
            $this->logException('count', $params, $e);
            throw $e;
        }
    }

    public function summary(array $filters): array
{
    $this->logRequest('summary', $filters);
    
    // Montar a consulta com base nos filtros
    $filterArray = [];
    $hasDateRange = false;

    foreach ($filters as $key => $value) {
        // Pula se o valor estiver vazio
        if (empty($value)) {
            continue;
        }

        if ($key === 'begin' || $key === 'end') {
            // Adiciona range apenas uma vez
            if (!$hasDateRange) {
                $rangeFilter = ['range' => ['ts' => []]];
                
                if (!empty($filters['begin'])) {
                    $rangeFilter['range']['ts']['gte'] = $filters['begin'];
                }
                
                if (!empty($filters['end'])) {
                    $rangeFilter['range']['ts']['lte'] = $filters['end'];
                }
                
                // Adiciona format para aceitar diferentes formatos de data
                $rangeFilter['range']['ts']['format'] = 'strict_date_optional_time||epoch_millis';
                
                $filterArray[] = $rangeFilter;
                $hasDateRange = true;
            }
        } else {
            // Para campos de texto, usa .keyword
            if (in_array($key, ['record_type', 'calling_number', 'called_number', 'nap', 'incoming_nap', 'codec', 'termination_cause_string'])) {
                $filterArray[] = ['term' => [$key . '.keyword' => $value]];
            } else {
                $filterArray[] = ['term' => [$key => $value]];
            }
        }
    }

    $query = [
        'bool' => [
            'filter' => $filterArray,
        ],
    ];

    // Log da query
    $this->logger->debug('Elasticsearch query:', ['query' => $query]);
        
    try {
        $response = $this->client->search([
            'index' => config('elasticsearch.index'),
            'body' => [
                'size' => 1000,
                'query' => $query,
                '_source' => true,
                'track_total_hits' => true,
            ],
        ]);

        // Converte a resposta para array
        $responseArray = is_array($response) ? $response : (array) $response->asArray();
        
        // Log da resposta
        $this->logger->debug('Elasticsearch response', ['response' => $responseArray]);

        return $responseArray;
    } catch (\Throwable $e) {
        $this->logException('summary', $filters, $e);
        throw $e;
    }
}

    public function call(string $method, array $params = []): array
    {
        $this->logRequest($method, $params);
        if (!isset($params['client'])) {
            $params['client'] = [];
        }
        if (!isset($params['client']['timeout'])) {
            $params['client']['timeout'] = (int) config('elasticsearch.timeout', 60);
        }

        try {
            if (!method_exists($this->client, $method)) {
                throw new \BadMethodCallException("Elasticsearch client method {$method} does not exist.");
            }
            $response = $this->client->{$method}($params);
            $this->logResponse($method, $params, $response);
            return is_array($response) ? $response : (array) $response;
        } catch (\Throwable $e) {
            $this->logException($method, $params, $e);
            throw $e;
        }
    }

    protected function logRequest(string $action, array $params): void
    {
        $safe = $this->sanitizeParams($params);
        $this->logger->debug("ES.request: {$action}", $safe);
        \Log::debug('ES.request.' . $action, $safe);
    }

    protected function logResponse(string $action, array $params, $response): void
    {
        $summary = $this->summarizeResponse($response);
        $this->logger->debug("ES.response: {$action}", ['summary' => $summary]);
        \Log::debug('ES.response.' . $action, ['summary' => $summary]);
    }

    protected function logException(string $action, array $params, \Throwable $e): void
    {
        $this->logger->error("ES.exception: {$action}", [
            'message' => $e->getMessage(),
            'class' => get_class($e),
            'trace' => $e->getTraceAsString(),
            'params' => $this->sanitizeParams($params),
        ]);
        \Log::error('ES.exception.' . $action, [
            'message' => $e->getMessage(),
            'class' => get_class($e)
        ]);
    }

    protected function sanitizeParams(array $params): array
    {
        $safe = $params;
        if (isset($safe['client']['username'])) {
            unset($safe['client']['username']);
        }
        if (isset($safe['client']['password'])) {
            unset($safe['client']['password']);
        }
        if (isset($safe['body'])) {
            $safe['body'] = $this->truncate(json_encode($safe['body']), 2000);
        }
        return $safe;
    }

    protected function summarizeResponse($response): array
    {
        if (is_array($response)) {
            $summary = $response;
        } else {
            try {
                $summary = (array) $response;
            } catch (\Throwable $e) {
                $summary = ['__raw' => (string) $response];
            }
        }

        $keep = ['took', 'timed_out', '_shards', 'hits', 'count', 'acknowledged'];
        $out = [];
        foreach ($keep as $k) {
            if (array_key_exists($k, $summary)) {
                $out[$k] = $summary[$k];
            }
        }

        if (!empty($summary['hits']) && is_array($summary['hits'])) {
            $hits = $summary['hits'];
            if (isset($hits['total'])) {
                $out['hits_total'] = $hits['total'];
            }
            if (!empty($hits['hits']) && is_array($hits['hits'])) {
                $first = $hits['hits'][0];
                $out['example_hit_id'] = $first['_id'] ?? null;
                $out['example_hit_index'] = $first['_index'] ?? null;
            }
        }
        return $out;
    }

    protected function truncate(string $text, int $max = 1000): string
    {
        if (strlen($text) <= $max) {
            return $text;
        }
        return substr($text, 0, $max) . '...(truncated)';
    }

    public function testConnection()
    {
        try {
            if ($this->client->ping()) {
                $searchResponse = $this->client->search([
                    'index' => 'cdr_leg',
                    'body' => [
                        'query' => [
                            'match_all' => new \stdClass()
                        ]
                    ]
                ]);

                $decodedResponse = json_decode($searchResponse->asString(), true);

                $this->logger->info('Elasticsearch response: ', [$decodedResponse]);

                return $decodedResponse;
            } else {
                throw new \Exception('Ping falhou.');
            }
        } catch (\Exception $e) {
            $this->logger->error('Elasticsearch connection error: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Failed to connect to Elasticsearch.']);
        }
    }
}