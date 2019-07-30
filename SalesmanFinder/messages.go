package main

const (
    /* Server to Client */
    AVAILABLE_SELLER_COUNT = "available_seller_count"
    SELLER_COUNT = "seller_count"
    SELLER_FOUND = "seller_found"
    SELLER_UNAVAILABLE = "seller_unavailable"
    SELLER_REQUESTED = "seller_requested"
    SELLER_REQUEST_CANCELED = "seller_request_canceled"
    RESET = "reset"
    STATUS = "status"

    /* Client to Server */
    GET_AVAILABLE_SELLER_COUNT = "get_available_seller_count"
    GET_SELLER_COUNT = "get_seller_count"
    IDENTIFY = "identify"
    REQUEST_SELLER = "request_seller"
    CANCEL_SELLER_REQUEST = "cancel_seller_request"
    CUSTOMER_IS_GONE = "customer_is_gone"
    SET_AVAILABLE = "set_available"
    ACCEPT_CUSTOMER = "accept_customer"
    CANCEL_CUSTOMER = "cancel_customer"
    ARRIVED_AT_CUSTOMER = "arrived_at_customer"
    GET_STATUS = "get_status"
)
