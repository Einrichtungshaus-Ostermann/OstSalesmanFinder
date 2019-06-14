<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components\Clients;

class Customer extends ClientHolder implements Groupable
{
    /** @var Seller $seller */
    private $seller;

    /** @var string $group */
    private $group;


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

    /**
     * @return string
     */
    public function getGroup(): string
    {
        return $this->group;
    }

    public function handleIdentify(array $msg): void
    {
        $this->group = $msg['group'];
    }
}
