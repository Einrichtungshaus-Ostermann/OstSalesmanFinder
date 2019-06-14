<?php
/**
 * Einrichtungshaus Ostermann GmbH & Co. KG - SalesmanFinder
 *
 * @package   OstSalesmanFinder
 *
 * @author    Tim Windelschmidt <tim.windelschmidt@ostermann.de>
 * @copyright 2019 Einrichtungshaus Ostermann GmbH & Co. KG
 * @license   proprietary
 */

namespace OstSalesmanFinder\Commands;

use OstSalesmanFinder\Components\Test;
use OstSalesmanFinder\Components\WebsocketHandler;
use Ratchet\Http\HttpServer;
use Ratchet\Server\IoServer;
use Ratchet\WebSocket\WsServer;
use React\EventLoop\Factory as LoopFactory;
use React\Socket\Server as Reactor;
use Shopware\Commands\ShopwareCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class WebsocketServerRunCommand extends ShopwareCommand
{
    /**
     * {@inheritdoc}
     */
    protected function configure()
    {
        $this
            ->setName('ost-salesman-finder:websocket-server-run')
            ->setDescription('Run the Websocket Server')
            ->addOption('port', 'p', InputOption::VALUE_OPTIONAL, 'The Port to bind to')
            ->setHelp('The <info>%command.name%</info> listens on the configured port, if not overridden with a parameter.');
    }

    /**
     * {@inheritdoc}
     */
    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $port = $input->getOption('port');

        if ((int)$port === 0) {
            $output->writeln('<error>' . 'Invalid port given' . '</error>');
            return;
        }

        $output->writeln('<info>' . sprintf('Got port: %s.', $port) . '</info>');

        $loop   = LoopFactory::create();

        $websocketHandler = new WebsocketHandler(Shopware()->Models(), $loop);

        $wsServer = new WsServer($websocketHandler);
        $wsServer->enableKeepAlive($loop, 10);

        $httpServer = new HttpServer($wsServer);

        $socket = new Reactor('0.0.0.0' . ':' . $port, $loop);
        $server = new IoServer($httpServer, $socket, $loop);

        $server->run();
    }
}
