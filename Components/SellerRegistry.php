<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components;

use OstSalesmanFinder\Components\Clients\ClientHolder;
use OstSalesmanFinder\Components\Clients\Seller;
use React\HttpClient\Client as HttpClient;
use React\Promise\Promise;
use React\Promise\Deferred;
use function foo\func;

class SellerRegistry
{

    /** @var Seller[] */
    private $seller = [];

    private $tickets = [];

    /**
     * @var HttpClient
     */
    private $httpClient;

    /**
     * SellerRegistry constructor.
     */
    public function __construct(HttpClient $httpClient)
    {
        $this->httpClient = $httpClient;
    }

    public function onIdentify(Client $client, array $identifyData): void
    {
        $foundSellers = array_filter($this->seller, function (Seller $seller) use ($identifyData) {
            return $seller->getNumber() === (string)$identifyData['number'];
        });

        if (count($foundSellers) > 1) {
            echo "Found more than one Seller for given number. Returning!\n";
            return;
        }

        if (count($foundSellers) === 0) {
            $seller = new Seller($client);
            $seller->handleIdentify($identifyData);
            $this->seller[] = $seller;

            return;
        }

        array_values($foundSellers)[0]->setClient($client);
    }

    /**
     * @return Seller[]
     */
    public function getAvailableSellers(): array
    {
        return array_filter($this->seller, static function (Seller $seller) {
            return $seller->isAvailable() === true;
        });
    }

    private function doGetRequest(string $url)
    {
        $request = $this->httpClient->request('GET', $url);

        $deferred = new Deferred();

        $request->on('response', function ($response) use ($deferred, $url) {
            echo 'Requesting ' . $url . "\n";

            $data = '';

            $response->on('data', function ($chunk) use ($data) {
                $data .= $chunk;
            });
            $response->on('end', function () use ($data, $deferred) {
                $deferred->resolve($data);
            });
        });

        $request->on('error', function (\Exception $e) use ($deferred) {
            $deferred->reject($e);
        });

        $request->end();

        return $deferred->promise();
    }

    public function getSellersForClient(Client $client)
    {
        return $this->doGetRequest('http://intranet-apswit11/api/consultantfinder/consultantsForIP/' . $client->getIP())
            ->then(function ($data) {
                return json_decode($data, true);
            })
            ->then(function (array $data) {
                return array_map(function (array $data) {
                    return $data['number'];
                }, $data);
            })
            ->then(function (array $numbers) {
                return array_map(function (string $number) {
                    return $this->getSellerForNumber($number);
                }, $numbers);
            });
    }

    public function getAvailableSellersForClient(Client $client)
    {
        return $this->getSellersForClient($client)
            ->then(function (array $sellers) {
                return array_filter($sellers, function (Seller $seller) {
                    return $seller->isAvailable();
                });
            });
    }

    /**
     * Return the Seller that is assigned to the Client
     * @param Client $client
     * @return Seller|null
     */
    public function getSellerForClient(Client $client): ?Seller
    {
        $sellers = array_filter($this->seller, static function (Seller $seller) use ($client) {
            return $seller->getClient() === $client;
        });

        if ($sellers === null || count($sellers) === 0) {
            return null;
        }

        return array_values($sellers)[0];
    }

    /**
     * @return Seller[]
     */
    public function getSellers(): array
    {
        return $this->seller;
    }

    public function removeSeller(Seller $seller): void
    {
        foreach ($this->seller as $i => $aSeller) {
            if ($seller === $aSeller) {
                unset($this->seller[$i]);
                return;
            }
        }
    }

    private function getSellerForNumber(string $number)
    {
        foreach ($this->getSellers() as $seller) {
            if ($seller->getNumber() === $number) {
                return $seller;
            }
        }

        return null;
    }
}
