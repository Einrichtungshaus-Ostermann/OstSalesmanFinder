<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components;

use RuntimeException;

trait MessageHandlerTrait
{
    public function __call($method, $args)
    {
        $method = $this->toCamelCase($method);
        if (method_exists($this, $method)) {
            return $this->$method(...$args);
        }

        throw new RuntimeException('Unknown Message: ' . $method);
    }

    private function toCamelCase($value): string
    {
        $value = ucwords(str_replace(array('-', '_'), ' ', $value));
        $value = str_replace(' ', '', $value);
        return lcfirst($value);
    }
}
