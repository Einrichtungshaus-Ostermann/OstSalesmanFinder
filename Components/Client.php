<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components;

use GuzzleHttp\Psr7\Request;
use Ratchet\ConnectionInterface;

final class Client
{
    /** @var ConnectionInterface $connection */
    protected $connection;

    /**
     * Seller constructor.
     * @param ConnectionInterface $connection
     */
    public function __construct(ConnectionInterface $connection)
    {
        $this->connection = $connection;
    }

    public function getID(): string
    {
        return $this->connection->resourceId;
    }

    public function getIP(): string
    {
        return $this->connection->remoteAddress;
    }

    public function getType(): ?string
    {
        return static::getConnectionType($this->connection);
    }

    public static function getConnectionType(ConnectionInterface $connection)
    {
        /** @var Request $httpRequest */
        $httpRequest = $connection->httpRequest;
        $path = $httpRequest->getUri()->getPath();

        if (array_key_exists($path, WebsocketHandler::CLIENT_ROUTES)) {
            return WebsocketHandler::CLIENT_ROUTES[$path];
        }

        return null;
    }

    /**
     * @return ConnectionInterface
     */
    public function getConnection(): ConnectionInterface
    {
        return $this->connection;
    }
}
