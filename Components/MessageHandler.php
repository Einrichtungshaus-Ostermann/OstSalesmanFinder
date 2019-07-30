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
        $clientHolder = null;

        switch ($client->getType()) {
            case WebsocketHandler::SELLER:
                $clientHolder = $this->sellerRegistry->getSellerForClient($client);
                break;
            case WebsocketHandler::CUSTOMER:
                $clientHolder = $this->customerRegistry->getCustomerForClient($client);
                break;
            default:
                break;
        }

        if ($clientHolder === null) {
            return;
        }

        $this->sellerRegistry->getAvailableSellersForClient($client)->then(function (array $sellers) use ($clientHolder) {
            echo 'Found ' . count($sellers) . ' Sellers for Client ' . $clientHolder->getClient()->getIP() . "\n";
            $clientHolder->send(
                $this->sendAvailableSellerCount(
                    count($sellers)
                )
            );
        });
    }

    public function getSellerCount(Client $client, $data = null): void
    {
        $client->getConnection()->send(
            $this->sendSellerCount(
                count(
                    $this->sellerRegistry->getSellers()
                )
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
                $this->customerRegistry->onIdentify($client, $data);
                break;
            default:
                break;
        }
    }

    public function requestSeller(Client $client, $data): void
    {
        $this->sellerRegistry->getAvailableSellersForClient($client)->then(function (array $sellers) use ($client) {
            if (count($sellers) === 0) {
                return;
            }

            $customer = $this->customerRegistry->getCustomerForClient($client);
            //        $this->tickets[] = new Ticket($customer);

            array_map(function (Seller $seller) use ($customer) {
                $seller->send(
                    $this->sendSellerRequested($customer)
                );
            }, $sellers);
        });
    }

    public function cancelSellerRequest(Client $client, $data): void
    {
        $customer = $this->customerRegistry->getCustomerForClient($client);
        $sellers = $this->sellerRegistry->getSellers();

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

    public function customerIsGone(Client $client, $data): void
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

    public function setAvailable(Client $client, $data): void
    {
        $seller = $this->sellerRegistry->getSellerForClient($client);
        if ($seller === null) {
            return;
        }

        $seller->setAvailable((bool)$data);

        $this->customerRegistry->getCustomersForSeller($seller)->then(function (array $customers) {
            array_map(function (Customer $customer) {
                $this->getAvailableSellerCount($customer->getClient(), null);
            }, $customers);
        });
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

        array_map(function (Seller $seller) use ($customer) {
            $seller->send(
                $this->sendSellerRequestCanceled($customer->getClient()->getID())
        );
        }, $this->sellerRegistry->getAvailableSellers());
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
