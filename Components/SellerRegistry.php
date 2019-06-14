<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components;

use OstSalesmanFinder\Components\Clients\Seller;

class SellerRegistry
{

    /** @var Seller[] */
    private $seller = [];

    private $tickets = [];

    /**
     * SellerRegistry constructor.
     */
    public function __construct()
    {
    }

    public function onIdentify(Client $client, array $identifyData): void
    {
        $foundSellers = array_filter($this->seller, function (Seller $seller) use ($identifyData) {
            return $seller->getNumber() === (string) $identifyData['number'];
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
     * @param string $group
     * @return Seller[]
     */
    public function getAvailableSellers(string $group = ''): array
    {
        return array_filter($this->seller, static function (Seller $seller) use ($group) {
            return $seller->isAvailable() === true && ($group === '' ? true : $seller->getGroup() === $group);
        });
    }

    public function getSellerForClient(Client $client): ?Seller
    {
        $sellers = array_filter($this->seller, static function (Seller $seller) use($client) {
            return $seller->getClient() === $client;
        });

        if ($sellers === null || count($sellers) === 0) {
            return null;
        }

        return array_values($sellers)[0];
    }

    /**
     * @param string $group
     * @return Seller[]
     */
    public function getSellers(string $group = ''): array
    {
        return array_filter($this->seller, static function (Seller $seller) use ($group) {
            return ($group === '' ? true : $seller->getGroup() === $group);
        });
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
}
