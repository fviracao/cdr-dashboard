<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\ElasticsearchService;
use Illuminate\Support\Facades\Log;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Registra o ElasticsearchService como um singleton
        $this->app->singleton(ElasticsearchService::class, function ($app) {
            return new ElasticsearchService(Log::getLogger()); // Passa o Logger
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}