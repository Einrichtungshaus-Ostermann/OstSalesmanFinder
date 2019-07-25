{extends file="parent:frontend/index/index.tpl"}

{block name="frontend_index_header_javascript_inline"}
    {$smarty.block.parent}

    {$salesmanFinderConfig = [
    'popupTimeout' => $salesmanFinderPopupTimeout,
    'searchTimeout' => $salesmanFinderSearchTimeout,
    'resetTimeout' => $salesmanFinderResetTimeout,
    'webSocketPath' => $salesmanFinderWebSocketPath,
    'testMode' => $salesmanFinderTestMode
    ]}

    var salesmanFinderConfig = salesmanFinderConfig || {$salesmanFinderConfig|json_encode};
{/block}

{block name="frontend_index_header_javascript_jquery_lib"}
    {$smarty.block.parent}
    <link href="/custom/plugins/OstSalesmanFinder/Resources/frontend/lib/noty.css" rel="stylesheet">
    <script src="/custom/plugins/OstSalesmanFinder/Resources/frontend/lib/noty.min.js" type="text/javascript"></script>
{/block}
