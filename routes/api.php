<?php

use App\Http\Controllers\ReportController;
use App\Http\Controllers\ElasticsearchController;

Route::post('/reports/search', [ReportController::class, 'search']);
Route::post('/reports/count', [ReportController::class, 'count']);
Route::get('/test-elasticsearch', [ElasticsearchController::class, 'testConnection']);

// Adicione uma rota de teste
Route::get('/test', function () {
    return response()->json(['message' => 'API is working']);
});