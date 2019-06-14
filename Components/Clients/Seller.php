<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components\Clients;

class Seller extends ClientHolder  implements Groupable
{
    /** @var boolean $available */
    private $available = false;

    /** @var string $name */
    private $name;

    /** @var string $number */
    private $number;

    /** @var string $group */
    private $group;

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
        $this->group = $msg['group'];
        $this->name = $msg['name'];
        $this->number = $msg['number'];
    }

    public function getName()
    {
        return $this->name;
    }

    /**
     * @return string
     */
    public function getGroup(): string
    {
        return $this->group;
    }

    /**
     * @return string
     */
    public function getNumber(): string
    {
        return $this->number;
    }
}
