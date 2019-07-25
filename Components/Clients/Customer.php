<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components\Clients;

class Customer extends ClientHolder
{
    /** @var Seller $seller */
    private $seller;

    /** @var string $division */
    private $division;

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
    public function getDivision(): ?string
    {
        return $this->division;
    }

    /**
     * @param string $division
     */
    public function setDivision(string $division): void
    {
        $this->division = $division;
    }
}
