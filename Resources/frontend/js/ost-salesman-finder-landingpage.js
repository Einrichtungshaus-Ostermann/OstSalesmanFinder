/**
 * Einrichtungshaus Ostermann GmbH & Co. KG - SalesmanFinder
 *
 * @package   OstSalesmanFinder
 *
 * @author    Tim Windelschmidt <tim.windelschmidt@ostermann.de>
 * @copyright 2019 Einrichtungshaus Ostermann GmbH & Co. KG
 * @license   proprietary
 */

;(function ($) {

    // use strict mode
    "use strict";

    // detail plugin
    $.plugin("ostSalesmanFinderLandingPage", {
        infoText: {
            "press-button-for-call": "",
            "searching-consultant": "Ein freier Berater wird gesucht.",
            "please-wait-for-consultant": "Bitte warte hier, bis er eingetroffen ist.",
            "seller-not-available": "Dein Berater ist leider nicht mehr verfügbar. Ein alternativer Berater wird gesucht.",
            "sorry-no-consultant": "Leider sind gerade alle Berater im Kundengespräch. Bitte versuche es in ein paar Minuten erneut.",
        },

        buttonText: {
            "call-consulant": "Berater rufen",
            "retry": "Nochmal versuchen",
            "cancel": "Abbrechen"
        },

        images: {
            "idle": "/custom/plugins/OstSalesmanFinder/Resources/frontend/img/salesman-finder--idle--icon--360x600.png",
            "waiting": "/custom/plugins/OstSalesmanFinder/Resources/frontend/img/salesman-finder--waiting--icon--360x600.png"
        },

        descriptionText: {
            "idle": "Überall wo Du dieses Symbol siehst, kannst Du einen Berater herbeirufen.",
            "waiting": "Dein persönlicher Berater ist auf dem Weg hierhin.",
            "empty": ""
        },

        titleText: {
            "idle": "Dürfen wir dir helfen?",
            "waiting": "Hilfe ist auf dem Weg..."
        },

        websocketConnection: null,

        sellerCount: 0,
        requested: false,
        found: false,

        onClick: () => {
        },

        setImageType: function (type) {
            this.getImage().css('background-image', "url('" + this.images[type] + "')");
        },

        setInfoText: function (text) {
            this.getInfo().text(this.infoText[text])
        },

        setDescriptionText: function (text) {
            this.getDescription().text(this.descriptionText[text])
        },

        setTitleText: function (text) {
            this.getTitle().text(this.titleText[text])
        },


        setButtonText: function (text) {
            this.getButton().show();
            this.getButton().text(this.buttonText[text])
        },

        getTitle: function () {
            return this.$el.find("#salesman-finder--title");
        },

        getDescription: function () {
            return this.$el.find("#salesman-finder--description");
        },

        getImage: function () {
            return this.$el.find('#salesman-finder--image');
        },

        getButton: function () {
            return this.$el.find('#salesman-finder--button');
        },

        getInfo: function () {
            return this.$el.find('#salesman-finder--text');
        },

        cancelRequest: function () {
            clearTimeout(this.timer);

            this.requested = false;
            this.found = false;

            this.setTitleText("idle");
            this.setDescriptionText("idle");
            this.setInfoText("press-button-for-call");
            this.setButtonText("call-consulant");
            this.onClick = this.requestSeller;

            this.websocketConnection.sendMessage(this.websocketConnection.messages.cancelSellerRequest());
        },

        requestSeller: function () {
            clearTimeout(this.timer);

            this.setTitleText("idle");
            this.setDescriptionText("idle");
            this.setInfoText("searching-consultant");
            this.getButton().hide();

            this.requested = true;
            this.found = false;

            this.timer = setTimeout(() => {
                this.onSearchTimeout();
            }, salesmanFinderConfig.searchTimeout * 1000);

            this.websocketConnection.sendMessage(this.websocketConnection.messages.requestSeller());
        },

        onSearchTimeout: function () {
            this.setTitleText("idle");
            this.setDescriptionText("idle");
            this.setInfoText("sorry-no-consultant");
            this.setButtonText("retry");
            this.onClick = this.requestSeller;

            this.found = false;

            if (this.requested) {
                this.websocketConnection.sendMessage(this.websocketConnection.messages.cancelSellerRequest());
                this.requested = false;
            }
        },

        onSellerUnavailable: function () {
            this.setTitleText("idle");
            this.setDescriptionText("empty");
            this.setImageType("idle");
            this.getButton().hide();

            this.found = false;

            if (this.sellerCount === 0) {
                this.setInfoText("sorry-no-consultant");
                this.onClick = this.requestSeller;

                if (this.requested) {
                    this.websocketConnection.sendMessage(this.websocketConnection.messages.cancelSellerRequest());
                    this.requested = false;
                }
                return;
            }

            this.setInfoText("seller-not-available");

            this.requested = true;
        },

        onSellerFound: function (data) {
            let seller = data['content'];

            this.setInfoText("please-wait-for-consultant");
            this.setImageType("waiting");
            this.setTitleText("waiting");
            this.setDescriptionText("waiting");
            this.getButton().hide();

            this.requested = false;
            this.found = true;

            clearTimeout(this.timer);
        },

        onAvailableSellerCount: function (data) {
            let amount = data['content'];

            if (amount > 0) {
                this.sellerCount = amount;

                if (!this.found) {
                    this.setTitleText("idle");
                    this.setDescriptionText("idle");
                    this.setInfoText("press-button-for-call");
                    this.setButtonText("call-consulant");
                    this.onClick = this.requestSeller;

                    this.getButton().show();
                }
            } else {
                this.sellerCount = amount;

                if (!this.found) {
                    this.setInfoText("sorry-no-consultant");
                    this.getButton().hide();

                    if (this.requested) {
                        this.requested = false;
                        this.websocketConnection.sendMessage(this.websocketConnection.messages.cancelSellerRequest());
                    }
                }
            }
        },

        onClose: function () {
            if (this.requested) {
                this.websocketConnection.sendMessage(this.websocketConnection.messages.cancelSellerRequest());
                this.requested = false;
            }

            this.found = false;
            this.onClick = this.requestSeller;

            clearTimeout(this.timer);
        },

        reset: function () {
            this.setInfoText("press-button-for-call");
            this.setButtonText("call-consulant");
            this.setTitleText("idle");
            this.setDescriptionText("idle");
            this.setImageType("idle");
            this.onClick = this.requestSeller;
            this.found = false;
        },

        init: function () {
            this.websocketConnection = new $.ostSalesmanFinder.WebsocketConnection();

            this.timer = null;

            this.websocketConnection.events.onReset(() => {
                this.reset();
            });

            this.websocketConnection.events.onSellerUnavailable((message) => {
                this.onSellerUnavailable(message);
            });
            this.websocketConnection.events.onSellerFound((message) => {
                this.onSellerFound(message);
            });
            this.websocketConnection.events.onAvailableSellerCount((message) => {
                this.onAvailableSellerCount(message);
            });

            this.websocketConnection.events.onConnect(() => {
                this.reset();
            });

            this.getButton().click(() => {
                this.onClick();
            })

            this.websocketConnection.sendMessage(this.websocketConnection.messages.getAvailableSellerCount());

            this.websocketConnection.connect(this.websocketConnection.types.customer);
            this.websocketConnection.sendMessage(this.websocketConnection.messages.identify({}));
        }
    });


    // subscribe to loading emotions
    $.subscribe('plugin/swEmotionLoader/onLoadEmotionFinished', function () {
        if ($('body').find('#salesman-finder--tablet-emotion').length > 0) {
            $("body").ostSalesmanFinderLandingPage();
        }
    })
})(jQuery);
