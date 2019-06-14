<?php
/**
 * Created by Tim Windelschmidt.
 */

namespace OstSalesmanFinder\Components\Clients;

use OstSalesmanFinder\Components\Client;

abstract class ClientHolder implements ClientTypeInterface
{
    /** @var Client $client */
    private $client;

    private $messageCache = [];

    /**
     * Seller constructor.
     * @param Client $client
     */
    public function __construct(Client $client)
    {
        $this->client = $client;
    }

    public function handleIdentify(array $identifyData): void
    {
    }

    public function send($data): void
    {

        if ($this->getClient() === null) {
            $this->messageCache[] = $data;
        } else {
            echo 'TO IP: ' . $this->client->getIP() . ' - Message: ' . json_decode($data, true)['type'] . ' - Data: ' . json_encode(json_decode($data, true)['content'] ?? '') . "\n";
            $this->client->getConnection()->send($data);
        }
    }

    /**
     * @return Client|null
     */
    public function getClient(): ?Client
    {
        return $this->client;
    }

    /**
     * @param Client|null $client
     */
    public function setClient(?Client $client): void
    {
        $this->client = $client;

        if ($client !== null) {
            foreach ($this->messageCache as $i => $data) {
                $this->send($data);
                unset($this->messageCache[$i]);
            }

        }
    }
}
