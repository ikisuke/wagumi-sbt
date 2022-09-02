function fulfillOrder(Order calldata order, bytes32 fulfillerConduitKey)
        external
        payable
        override
        returns (bool fulfilled)
    {
        // Convert order to "advanced" order, then validate and fulfill it.
        fulfilled = _validateAndFulfillAdvancedOrder(
            _convertOrderToAdvanced(order),
            new CriteriaResolver[](0), // No criteria resolvers supplied.
            fulfillerConduitKey,
            msg.sender
        );
    }
    /**
     * @notice Match an arbitrary number of orders, each with an arbitrary
     *         number of items for offer and consideration along with a set of
     *         fulfillments allocating offer components to consideration
     *         components. Note that this function does not support
     *         criteria-based or partial filling of orders (though filling the
     *         remainder of a partially-filled order is supported).
     *
     * @param orders            The orders to match. Note that both the offerer
     *                          and fulfiller on each order must first approve
     *                          this contract (or their conduit if indicated by
     *                          the order) to transfer any relevant tokens on
     *                          their behalf and each consideration recipient
     *                          must implement `onERC1155Received` in order to
     *                          receive ERC1155 tokens.
     * @param fulfillments      An array of elements allocating offer components
     *                          to consideration components. Note that each
     *                          consideration component must be fully met in
     *                          order for the match operation to be valid.
     *
     * @return executions An array of elements indicating the sequence of
     *                    transfers performed as part of matching the given
     *                    orders.
     */

    function matchOrders(
        Order[] calldata orders,
        Fulfillment[] calldata fulfillments
    ) external payable override returns (Execution[] memory executions) {
        // Convert to advanced, validate, and match orders using fulfillments.
        return
            _matchAdvancedOrders(
                _convertOrdersToAdvanced(orders),
                new CriteriaResolver[](0), // No criteria resolvers supplied.
                fulfillments
            );
    }

struct Order {
    OrderParameters parameters;
    bytes signature;
}



struct OrderParameters {
    address offerer; // 0x00 
    address zone; // 0x20
    OfferItem[] offer; // 0x40
    ConsiderationItem[] consideration; // 0x60
    OrderType orderType; // 0x80
    uint256 startTime; // 0xa0
    uint256 endTime; // 0xc0
    bytes32 zoneHash; // 0xe0
    uint256 salt; // 0x100
    bytes32 conduitKey; // 0x120
    uint256 totalOriginalConsiderationItems; // 0x140
    // offer.length                          // 0x160
}

struct OfferItem {
    ItemType itemType;
    address token;
    uint256 identifierOrCriteria;
    uint256 startAmount;
    uint256 endAmount;
}

struct ConsiderationItem {
    ItemType itemType;
    address token;
    uint256 identifierOrCriteria;
    uint256 startAmount;
    uint256 endAmount;
    address payable recipient;
}

/**
 * @dev Advanced orders include a numerator (i.e. a fraction to attempt to fill)
 *      and a denominator (the total size of the order) in addition to the
 *      signature and other order parameters. It also supports an optional field
 *      for supplying extra data; this data will be included in a staticcall to
 *      `isValidOrderIncludingExtraData` on the zone for the order if the order
 *      type is restricted and the offerer or zone are not the caller.
 */
struct AdvancedOrder {
    OrderParameters parameters;
    uint120 numerator;
    uint120 denominator;
    bytes signature;
    bytes extraData;
}

/**
* @dev Internal pure function to convert an array of orders to an array of
*      advanced orders with numerator and denominator of 1.
*
* @param orders The orders to convert.
*
* @return advancedOrders The new array of partial orders.
*/

    function _convertOrdersToAdvanced(Order[] calldata orders)
        internal
        pure
        returns (AdvancedOrder[] memory advancedOrders)
    {
        // Read the number of orders from calldata and place on the stack.
        uint256 totalOrders = orders.length;

        // Allocate new empty array for each partial order in memory.
        advancedOrders = new AdvancedOrder[](totalOrders);

        // Skip overflow check as the index for the loop starts at zero.
        unchecked {
            // Iterate over the given orders.
            for (uint256 i = 0; i < totalOrders; ++i) {
                // Convert to partial order (1/1 or full fill) and update array.
                advancedOrders[i] = _convertOrderToAdvanced(orders[i]);
            }
        }

        // Return the array of advanced orders.
        return advancedOrders;
    }
    /**
     * @dev Internal pure function to convert an order to an advanced order with
     *      numerator and denominator of 1 and empty extraData.
     *
     * @param order The order to convert.
     *
     * @return advancedOrder The new advanced order.
     */

        function _convertOrderToAdvanced(Order calldata order)
        internal
        pure
        returns (AdvancedOrder memory advancedOrder)
    {
        // Convert to partial order (1/1 or full fill) and return new value.
        advancedOrder = AdvancedOrder(
            order.parameters,
            1,
            1,
            order.signature,
            ""
        );
    }

/**
 * @dev A criteria resolver specifies an order, side (offer vs. consideration),
 *      and item index. It then provides a chosen identifier (i.e. tokenId)
 *      alongside a merkle proof demonstrating the identifier meets the required
 *      criteria.
 */

    struct CriteriaResolver {
    uint256 orderIndex;
    Side side;
    uint256 index;
    uint256 identifier;
    bytes32[] criteriaProof;
}
