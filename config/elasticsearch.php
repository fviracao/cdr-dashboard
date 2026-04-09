<?php

return [
    'hosts' => [
        env('ELASTICSEARCH_HOSTS', 'http://199.59.96.167:9237'),
    ],
    'user' => env('ELASTICSEARCH_USER', null),
    'pass' => env('ELASTICSEARCH_PASS', null),
    'index' => env('ELASTICSEARCH_INDEX', 'cdr_leg'),
];