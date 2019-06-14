<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components\Clients;

interface ClientTypeInterface
{
    public function handleIdentify(array $identifyData): void;

}
