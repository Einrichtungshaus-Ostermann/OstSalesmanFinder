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
    $.plugin("ostSalesmanFinderCustomer", {
        infoText: {
            "press-button-for-call": "",
            "searching-consultant": "Ein freier Verkäufer wird gesucht.",
            "please-wait-for-consultant": "Bitte warte hier, bis er eingetroffen ist.",
            "seller-not-available": "Dein Verkäufer ist leider nicht mehr verfügbar. Ein alternativer Verkäufer wird gesucht.",
            "sorry-no-consultant": "Leider sind gerade alle Verkäufer im Kundengespräch. Bitte versuche es in ein paar Minuten erneut.",
        },

        buttonText: {
            "call-consulant": "Verkäufer rufen",
            "retry": "Nochmal versuchen",
            "cancel": "Abbrechen"
        },

        images: {
            "idle": "/custom/plugins/OstSalesmanFinder/Resources/frontend/img/salesman-finder--idle--icon.png",
            "waiting": "/custom/plugins/OstSalesmanFinder/Resources/frontend/img/salesman-finder--waiting--icon.png"
        },

        descriptionText: {
            "idle": "Überall wo Du dieses Symbol siehst, kannst Du einen Verkäufer herbeirufen.",
            "waiting": "Dein persönlicher Verkäufer ist auf dem Weg hierhin.",
            "empty": ""
        },

        titleText: {
            "idle": "Dürfen wir dir helfen?",
            "waiting": "Hilfe ist auf dem Weg..."
        },

        content: '<div style="float: left; width: 40%; ">' +
            '<img id="salesman-finder--image" src="/custom/plugins/OstSalesmanFinder/Resources/frontend/img/salesman-finder--idle--icon.png" style="margin: auto; margin-top: 50px;">' +
            '</div><div style="float: left;width: 55%;margin-right: 5%;padding-top: 30px;">' +
            '<span id="salesman-finder--title" style="text-transform: uppercase;font-weight: bold;font-size: 28px;">#TEXT#</span>' +
            '<p id="salesman-finder--description" style="font-size: 28px;line-height: 36px;margin-top: 30px;">#TEXT#</p>' +
            '<p id="salesman-finder--text" style="font-size: 28px;line-height: 36px;margin-top: 30px;">#TEXT#</p><div style="text-align: center;"><button style="margin: auto; width: 80%; text-align: center; margin-top: 20px;" class="btn is--primary" id="salesman-finder--button">#TEXT#</button></div></div>',

        websocketConnection: null,

        sellerCount: 0,
        modal: null,
        requested: false,
        found: false,

        onClick: () => {
        },

        setImageType: function (type) {
            this.getImage().attr("src", this.images[type])
        },

        setInfoText: function (text) {
            if (this.modal === null) {
                this.openPopup();
            }

            this.getInfo().text(this.infoText[text])
        },

        setDescriptionText: function (text) {
            if (this.modal === null) {
                this.openPopup();
            }

            this.getDescription().text(this.descriptionText[text])
        },

        setTitleText: function (text) {
            if (this.modal === null) {
                this.openPopup();
            }

            this.getTitle().text(this.titleText[text])
        },


        setButtonText: function (text) {
            if (this.modal === null) {
                this.openPopup();
            }

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

        getIcon: function () {
            return this.$el.find('.entry--salesman-finder.icon--salesman-finder');
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
                this.getIcon().show();

                if (this.modal !== null && !this.requested && !this.found) {
                    this.setTitleText("idle");
                    this.setDescriptionText("idle");
                    this.setInfoText("press-button-for-call");
                    this.setButtonText("call-consulant");
                    this.onClick = this.requestSeller;

                    this.getButton().show();
                }
            } else {
                this.sellerCount = amount;
                this.getIcon().hide();

                if (this.modal !== null && !this.found) {
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

            this.modal = null;
            this.found = false;
            this.onClick = this.requestSeller;

            clearTimeout(this.timer);
        },

        openPopup: function () {
            this.modal = $.modal.open(this.content, {
                width: 800, height: 400, onClose: () => {
                    this.onClose();
                }
            });

            this.setInfoText("press-button-for-call");
            this.setButtonText("call-consulant");
            this.setTitleText("idle");
            this.setDescriptionText("idle");
            this.onClick = this.requestSeller;

            this.getButton().click(() => {
                this.onClick();
            })
        },

        init: function () {
            this.websocketConnection = new $.ostSalesmanFinder.WebsocketConnection();

            this.timer = null;

            this.websocketConnection.events.onReset(() => {
                if (this.modal !== null) {
                    this.modal.close();
                }

                this.onClick = this.requestSeller;
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
                this.getIcon().click(() => {
                    this.openPopup();
                });
            });

            this.websocketConnection.sendMessage(this.websocketConnection.messages.getAvailableSellerCount());

            this.websocketConnection.connect(this.websocketConnection.types.customer);
            this.websocketConnection.sendMessage(this.websocketConnection.messages.identify({}));


            if (window.sessionStorage.getItem("disable-seller-popup") !== "true") {
                if (salesmanFinderConfig.salesmanFinderPopupTimeout === -1) {
                    return;
                }

                setTimeout(() => {
                    if (!$('.entry--salesman-finder').is(":visible")) {
                        return;
                    }

                    this.openPopup();

                    window.sessionStorage.setItem("disable-seller-popup", "true");
                }, salesmanFinderConfig.popupTimeout * 1000);
            }
        }
    });

    $(document).ready(function () {
        let body = $('body');
        if (!body.hasClass('is--consultant') && !body.hasClass('has--no-header')) {
            body.ostSalesmanFinderCustomer();
        }
    });
})(jQuery);
