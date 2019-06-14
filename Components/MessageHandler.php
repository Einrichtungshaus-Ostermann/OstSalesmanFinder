<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components;

use OstSalesmanFinder\Components\Clients\Customer;
use OstSalesmanFinder\Components\Clients\Seller;

class MessageHandler
{
    use MessageHandlerTrait;
    use MessagesTrait;

    /**
     * @var SellerRegistry
     */
    private $sellerRegistry;

    /**
     * @var CustomerRegistry
     */
    private $customerRegistry;

    /** @var Ticket[] $tickets */
    private $tickets = [];

    public function __construct(SellerRegistry $sellerRegistry, CustomerRegistry $customerRegistry)
    {
        $this->sellerRegistry = $sellerRegistry;
        $this->customerRegistry = $customerRegistry;
    }

    public function getAvailableSellerCount(Client $client, $data = null): void
    {
        $groupable = null;

        switch ($client->getType()) {
            case WebsocketHandler::SELLER:
                $groupable = $this->sellerRegistry->getSellerForClient($client);
                break;
            case WebsocketHandler::CUSTOMER:
                $groupable = $this->customerRegistry->getCustomerForClient($client);
                break;
            default:
                break;
        }

        if ($groupable === null) {
            return;
        }

        /** @var Seller|Customer $groupable */
        $groupable->send(
            $this->sendAvailableSellerCount(
                count(
                    $this->sellerRegistry->getAvailableSellers(
                        $groupable->getGroup()
                    )
                )
            )
        );
    }

    public function getSellerCount(Client $client, $data = null): void
    {
        $client->getConnection()->send(
            $this->sendSellerCount(
                $this->sellerRegistry->getSellers()
            )
        );
    }

    public function identify(Client $client, $data): void
    {
        switch ($client->getType()) {
            case WebsocketHandler::SELLER:
                $this->sellerRegistry->onIdentify($client, $data);
                break;
            case WebsocketHandler::CUSTOMER:
                $customer = $this->customerRegistry->getCustomerForClient($client);
                $customer->handleIdentify($data);
                break;
            default:
                break;
        }
    }

    public function requestSeller(Client $client, $data): void
    {
        $customer = $this->customerRegistry->getCustomerForClient($client);
        $sellers = $this->sellerRegistry->getAvailableSellers($customer->getGroup());

        if (count($sellers) === 0) {
            return;
        }

//        $this->tickets[] = new Ticket($customer);

        array_map(function (Seller $seller) use ($customer) {
            $seller->send(
                $this->sendSellerRequested($customer->getClient()->getID())
            );
        }, $sellers);
    }

    public function cancelSellerRequest(Client $client, $data): void
    {
        $customer = $this->customerRegistry->getCustomerForClient($client);
        $sellers = $this->sellerRegistry->getAvailableSellers($customer->getGroup());

        if (count($sellers) === 0) {
            return;
        }

        array_map(function (Seller $seller) use ($customer) {
            $seller->send(
                $this->sendSellerRequestCanceled($customer->getClient()->getID())
            );
        }, $sellers);

        foreach ($this->tickets as $i => $ticket) {
            if ($ticket->getCustomer() === $customer) {
                unset($this->tickets[$i]);
            }
        }
    }

    public function setAvailable(Client $client, $data): void
    {
        $seller = $this->sellerRegistry->getSellerForClient($client);
        if ($seller === null) {
            return;
        }

        $seller->setAvailable((bool)$data);

        array_map(function (Seller $seller) {
            if ($seller->getClient() === null) {
                return;
            }

            $this->getAvailableSellerCount($seller->getClient(), null);

        }, $this->sellerRegistry->getSellers($seller->getGroup()));
    }

    public function acceptCustomer(Client $client, $data): void
    {
        $seller = $this->sellerRegistry->getSellerForClient($client);
        if ($seller === null) {
            return;
        }

        $customer = $this->customerRegistry->getCustomerForID((string)$data);

        if ($customer === null) {
            $seller->send(
                $this->sendSellerRequestCanceled($data)
            );
            return;
        }

        if ($customer->getSeller() !== null) {
            $seller->send(
                $this->sendSellerRequestCanceled($customer->getClient()->getID())
            );
            return;
        }

        $customer->setSeller($seller);
        $customer->send(
            $this->sendSellerFound($seller)
        );
    }

    public function cancelCustomer(Client $client, $data): void
    {
        $seller = $this->sellerRegistry->getSellerForClient($client);
        $customer = $this->customerRegistry->getCustomerForID((int)$data);

        if ($customer === null) {
            return;
        }

        $customer->setSeller(null);
        $this->requestSeller($customer->getClient(), null);

        $customer->send(
            $this->sendSellerCanceled()
        );
    }

    public function arrivedAtCustomer(Client $client, $data): void
    {
        $seller = $this->sellerRegistry->getSellerForClient($client);
        if ($seller === null) {
            return;
        }

        $customer = $this->customerRegistry->getCustomerForSeller($seller);

        if ($customer === null) {
            return;
        }

        $customer->setSeller(null);
        $customer->send(
            $this->sendReset()
        );
    }

    public function getStatus(Client $client, $data): void
    {
        $seller = $this->sellerRegistry->getSellerForClient($client);
        if ($seller === null) {
            return;
        }

        $seller->send(
            $this->sendStatus($seller->isAvailable())
        );
    }
}
