<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components\Clients;

class Customer extends ClientHolder
{
    /** @var Seller $seller */
    private $seller;

    /**
     * @return Seller|null
     */
    public function getSeller()
    {
        return $this->seller;
    }

    /**
     * @param Seller $seller
     */
    public function setSeller($seller)
    {
        $this->seller = $seller;
    }
}
