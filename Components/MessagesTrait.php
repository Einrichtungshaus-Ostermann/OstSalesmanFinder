<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components;

use OstSalesmanFinder\Components\Clients\Seller;

trait MessagesTrait
{

    public function sendAvailableSellerCount(string $count): string
    {
        return json_encode([
            'type' => 'available_seller_count',
            'content' => $count
        ]);
    }

    public function sendSellerCount(string $count): string
    {
        return json_encode([
            'type' => 'seller_count',
            'content' => $count
        ]);
    }

    public function sendSellerFound(Seller $seller): string
    {
        return json_encode([
            'type' => 'seller_found',
            'content' => [
                'name' => $seller->getName()
            ]
        ]);
    }

    public function sendSellerCanceled(): string
    {
        return json_encode([
            'type' => 'seller_unavailable'
        ]);
    }

    public function sendSellerRequested(int $customerID): string
    {
        return json_encode([
            'type' => 'seller_requested',
            'content' => $customerID
        ]);
    }

    public function sendSellerRequestCanceled(int $customerID): string
    {
        return json_encode([
            'type' => 'seller_request_canceled',
            'content' => $customerID,
        ]);
    }

    public function sendReset(): string
    {
        return json_encode([
            'type' => 'reset',
        ]);
    }

    public function sendStatus(bool $isAvailable)
    {
        return json_encode([
            'type' => 'status',
            'content' => $isAvailable,
        ]);
    }

}
