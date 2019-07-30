<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components;

use OstSalesmanFinder\Components\Clients\Customer;
use OstSalesmanFinder\Components\Clients\Seller;

class CustomerRegistry
{
    use RegistryTrait;

    private $customer = [];

    /**
     * CustomerRegistry constructor.
     * @param \React\HttpClient\Client $httpClient
     */
    public function __construct(\React\HttpClient\Client $httpClient)
    {
        $this->httpClient = $httpClient;
    }

    public function getDataForCustomer(Client $client)
    {
        echo 'Requsting ProductPilotInfo for IP ' . $client->getIP() . "\n";
        return $this->doGetRequest('http://intranet-apswit11/api/productpilot/getProductPilotForIP/' . $client->getIP())
            ->then(function ($data) {
                return json_decode($data, true);
            }, function (\Exception $e) {
                echo $e->getMessage();
            })->then(function ($data) {
                return $data['data'] ?? null;
            });
    }


    public function getCustomersForSeller(Seller $seller)
    {
        echo 'Requsting Customers for Seller ' . $seller->getNumber() . "\n";
        return $this->doGetRequest('http://intranet-apswit11/api/consultantfinder/customerForSeller/' . $seller->getNumber())
            ->then(function ($data) {
                return json_decode($data, true);
            }, function (\Exception $e) {
                echo $e->getMessage();
            })
            ->then(function (array $data) {
                return array_map(function (array $data) {
                    return $data['ipAddress'];
                }, $data);
            })->then(function(array $ipAddresses) {
                return array_filter($this->customer, function (Customer $customer) use ($ipAddresses) {
                        return in_array($customer->getClient()->getIP(), $ipAddresses, true);
                });
            });
    }

    public function onIdentify(Client $client, array $data): void
    {
        $customer = $this->getCustomerForClient($client);

        if ($customer === null) {
            return;
        }

        $this->getDataForCustomer($client)->then(function ($data) use ($customer) {
            if ($data === null) {
                return;
            }

            $customer->setDivision($data['division'] ?? 'Unbekannt');
        });
    }

    public function getCustomerForClient(Client $client): Customer
    {
        $customers = array_filter($this->customer, function (Customer $customer) use ($client) {
            return $customer->getClient() === $client;
        });

        if (count($customers) === 0) {
            $customer = new Customer($client);
            $this->customer[] = $customer;
        } else {
            $customer = array_values($customers)[0];
        }

        return $customer;
    }

    public function getCustomerForID(string $id): ?Customer
    {
        $customers = array_filter($this->customer, function (Customer $customer) use ($id) {
            return $customer->getClient()->getID() === $id;
        });

        if ($customers === null || count($customers) !== 1) {
            return null;
        }

        return array_values($customers)[0];
    }

    public function getCustomerForSeller(Seller $seller): ?Customer
    {
        $customers = array_filter($this->customer, function (Customer $customer) use ($seller) {
            return $customer->getSeller() === $seller;
        });

        if ($customers === null || count($customers) !== 1) {
            return null;
        }

        return array_values($customers)[0];
    }

    public function removeCustomer(Customer $customer): void
    {
        foreach ($this->customer as $i => $aCustomer) {
            if ($customer === $aCustomer) {
                unset($this->customer[$i]);
                return;
            }
        }
    }

    /**
     * @return array
     */
    public function getCustomer(): array
    {
        return $this->customer;
    }
}
