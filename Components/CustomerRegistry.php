<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components;

use OstSalesmanFinder\Components\Clients\Customer;
use OstSalesmanFinder\Components\Clients\Seller;

class CustomerRegistry
{
    private $customer = [];

    public function getCustomerForClient(Client $client): Customer
    {
        $customers = array_filter($this->customer, function (Customer $customer) use($client) {
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
        $customers = array_filter($this->customer, function (Customer $customer) use($id) {
            return $customer->getClient()->getID() === $id;
        });

        if ($customers === null || count($customers) !== 1) {
            return null;
        }

        return array_values($customers)[0];
    }

    public function getCustomerForSeller(Seller $seller): ?Customer
    {
        $customers = array_filter($this->customer, function (Customer $customer) use($seller) {
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
}
