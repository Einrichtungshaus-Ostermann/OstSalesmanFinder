<?php


namespace OstSalesmanFinder\Components;


use React\HttpClient\Client as HttpClient;
use React\Promise\Deferred;

trait RegistryTrait
{
    /**
     * @var HttpClient
     */
    private $httpClient;

    private function doGetRequest(string $url)
    {
        $request = $this->httpClient->request('GET', $url);

        $deferred = new Deferred();

        $request->on('response', function ($response) use ($deferred, $url) {
            echo 'Requesting ' . $url . "\n";

            $data = '';

            $response->on('data', function ($chunk) use (&$data) {
                $data .= $chunk;
            });
            $response->on('end', function () use (&$data, $deferred) {
                $deferred->resolve($data);
            });
        });

        $request->on('error', function (\Exception $e) use ($deferred) {
            $deferred->reject($e);
        });

        $request->end();

        return $deferred->promise();
    }
}
