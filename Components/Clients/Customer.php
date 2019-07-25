<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components\Clients;

class Customer extends ClientHolder
{
    /** @var Seller $seller */
    private $seller;

    /** @var string $location */
    private $location;

    /**
     * @return Seller|null
     */
    public function getSeller(): ?Seller
    {
        return $this->seller;
    }

    /**
     * @param Seller $seller
     */
    public function setSeller($seller): void
    {
        $this->seller = $seller;
    }

    /**
     * @return string
     */
    public function getLocation(): ?string
    {
        return $this->location;
    }

    /**
     * @param string $location
     */
    public function setLocation(string $location): void
    {
        $this->location = $location;
    }
}
