<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components;

use Exception;
use Ratchet\ConnectionInterface;
use Ratchet\MessageComponentInterface;
use React\EventLoop\LoopInterface;
use Shopware\Components\Model\ModelManager;

class WebsocketHandler implements MessageComponentInterface
{
    public const CUSTOMER = 'customer';
    public const SELLER = 'seller';

    public const CLIENT_ROUTES = ['/customer' => self::CUSTOMER, '/seller' => self::SELLER];

    public $sellerRegistry;

    /** @var Client[] */
    public $clients = [];

    /**
     * @var ModelManager
     */
    private $modelManager;
    /**
     * @var MessageHandler
     */
    private $messageHandler;
    /**
     * @var LoopInterface
     */
    private $loop;
    /**
     * @var CustomerRegistry
     */
    private $customerRegistry;

    public function __construct(ModelManager $modelManager, LoopInterface $loop)
    {
        $this->modelManager = $modelManager;
        $this->sellerRegistry = new SellerRegistry();
        $this->customerRegistry = new CustomerRegistry();
        $this->messageHandler = new MessageHandler($this->sellerRegistry, $this->customerRegistry);
        $this->loop = $loop;
    }

    public function onOpen(ConnectionInterface $conn): void
    {
        $connectionType = Client::getConnectionType($conn);

        if ($connectionType === null) {
            $conn->close();
            return;
        }

        $this->clients[] = new Client($conn);
    }

    public function onMessage(ConnectionInterface $conn, $msg): void
    {
        $client = $this->getClientForConnection($conn);

        // Just for safety
        if ($client === null) {
            $conn->close();
            return;
        }

        $data = json_decode($msg, true);
        if ($data === null) {
            return;
        }

        echo 'FROM IP: ' . $client->getIP() . ' - Message: ' . $data['type'] . ' - Data: ' . json_encode($data['content'] ?? '') . "\n";

        $messageType = $data['type'];
        $this->messageHandler->$messageType($client, $data['content'] ?? null);
    }

    private function getClientForConnection(ConnectionInterface $connection): ?Client
    {
        foreach ($this->clients as $client) {
            if ($client->getConnection() === $connection) {
                break;
            }
        }
        return $client ?? null;
    }

    public function onClose(ConnectionInterface $conn): void
    {
        $client = $this->getClientForConnection($conn);
        if ($client === null) {
            return;
        }

        switch ($client->getType()) {
            case static::SELLER:
                $seller = $this->sellerRegistry->getSellerForClient($client);
                if ($seller !== null) {
                    $seller->setClient(null);

                    $this->loop->addTimer(5 * 60, function () use ($seller) {
                        if ($seller->getClient() === null) {
                            $this->sellerRegistry->removeSeller($seller);
                        }
                    });
                }

                break;
            case static::CUSTOMER:
                if ($client !== null) {
                    $this->messageHandler->cancelSellerRequest($client, null);
                }

                $customer = $this->customerRegistry->getCustomerForClient($client);
                $this->customerRegistry->removeCustomer($customer);

                break;
            default:
                break;
        }

        foreach ($this->clients as $key => $client) {
            if ($client->getConnection() === $conn) {
                unset($this->clients[$key]);
                break;
            }
        }
    }

    public function onError(ConnectionInterface $conn, Exception $e): void
    {
        echo "An error has occurred: {$e->getMessage()}\n";

        $conn->close();
    }
}
