<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components\Clients;

class Seller extends ClientHolder
{
    /** @var boolean $available */
    private $available = false;

    /** @var string $name */
    private $name;

    /** @var string $number */
    private $number;
    /**
     * @return bool
     */
    public function isAvailable()
    {
        return $this->available;
    }

    /**
     * @param bool $available
     */
    public function setAvailable($available)
    {
        $this->available = $available;
    }

    public function handleIdentify(array $msg): void
    {
        $this->name = 'TODO';
        $this->number = $msg['number'];
    }

    public function getName()
    {
        return $this->name;
    }

    /**
     * @return string
     */
    public function getNumber(): string
    {
        return $this->number;
    }
}
