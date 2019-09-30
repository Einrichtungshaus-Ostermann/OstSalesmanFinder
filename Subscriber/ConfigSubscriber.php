<?php

namespace OstSalesmanFinder\Subscriber;

use Enlight\Event\SubscriberInterface;

class ConfigSubscriber implements SubscriberInterface
{
    /**
     * @var array
     */
    private $config;
    /**
     * @var string
     */
    private $viewDir;

    /**
     * ConfigSubscriber constructor.
     * @param array $config
     * @param string $viewDir
     */
    public function __construct(array $config, string $viewDir)
    {
        $this->config = $config;
        $this->viewDir = $viewDir;
    }

    public static function getSubscribedEvents()
    {
        return [
            'Enlight_Controller_Action_PreDispatch_Frontend' => 'preDispatch',
            'Enlight_Controller_Action_PostDispatch_Frontend' => 'onRequest',
            'Enlight_Controller_Action_PostDispatch_Frontend_Listing' => 'onListing',
            'Enlight_Controller_Action_PostDispatch_Frontend_Detail' => 'onDetail',
        ];
    }

    public function preDispatch(\Enlight_Event_EventArgs $args)
    {
        /** @var \Shopware_Controllers_Frontend_Listing $subject */
        $subject = $args->getSubject();
        $subject->View()->addTemplateDir($this->viewDir);
    }

    public function onRequest(\Enlight_Event_EventArgs $args)
    {
        /** @var \Shopware_Controllers_Frontend_Listing $subject */
        $subject = $args->getSubject();

        if ($subject->View()->getAssign('salesmanFinderPopupTimeout') === null) {
            $subject->View()->assign('salesmanFinderPopupTimeout', -1);
        }

        $subject->View()->assign('salesmanFinderSearchTimeout', $this->config['searchTimeout']);
        $subject->View()->assign('salesmanFinderResetTimeout', $this->config['resetTimeout']);
        $subject->View()->assign('salesmanFinderWebSocketPath', $this->config['webSocketPath']);
        $subject->View()->assign('salesmanFinderTestMode', $this->config['testMode']);
    }

    public function onListing(\Enlight_Event_EventArgs $args)
    {
        /** @var \Shopware_Controllers_Frontend_Listing $subject */
        $subject = $args->getSubject();

        $subject->View()->assign('salesmanFinderPopupTimeout', $this->config['listingPopupTimeout']);
    }

    public function onDetail(\Enlight_Event_EventArgs $args)
    {
        /** @var \Shopware_Controllers_Frontend_Detail $subject */
        $subject = $args->getSubject();

        $subject->View()->assign('salesmanFinderPopupTimeout', $this->config['detailPopupTimeout']);
    }
}
