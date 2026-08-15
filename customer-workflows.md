# New World Cargo Customer Workflow Specification

## Confirmed Operating Model

New World Cargo is primarily a **cargo receiving and forwarding service**. The app customer is normally the **cargo owner/recipient**. That customer has a supplier, seller, or contact in China, Dubai, Zambia, or another market. The supplier sends the parcel to a New World Cargo origin office. New World Cargo receives and registers the parcel, forwards it to the selected destination, warehouses it on arrival, notifies the owner, then supports collection, local delivery, or onward delivery. The final charge is presented at the end of the service.

> The cargo owner starts the digital journey. The supplier is the physical sender, but does not need to be treated as an app user or asked to complete the recipient flow.

## Roles and Responsibilities

| Role | Responsibility in the journey | App relationship |
|---|---|---|
| **Cargo owner / customer** | Chooses the origin office and destination, supplies the debit note, tracks cargo, selects collection or delivery, and pays final charges. | Primary signed-in user. |
| **Supplier / sender** | Sends the parcel to the selected New World Cargo origin office. | Referenced in the debit note or office registration; not required to use the app. |
| **New World Cargo origin office** | Receives, scans, and registers the parcel after it reaches the office. | Operational event source. |
| **New World Cargo forwarding network** | Moves cargo by air and other required transport legs. | Operational event source. |
| **Destination warehouse** | Receives and warehouses cargo, then makes it available for collection, local delivery, or onward forwarding. | Operational event source. |

## One Cargo Lifecycle

There is one core lifecycle regardless of whether cargo begins in China, Dubai, Zambia, or another office, and regardless of whether the final destination is Zambia, a local address, or a regional destination such as Zimbabwe.

```text
Customer starts expected cargo
  → Select origin office and destination
  → Provide debit note
  → Supplier delivers cargo to New World Cargo origin office
  → Origin office receives and registers cargo
  → Cargo is prepared and forwarded
  → Cargo arrives at destination warehouse
  → Owner is notified
  → Owner chooses collection, local delivery, or onward delivery
  → Final charge is issued and paid
  → Cargo is released/delivered and service is complete
```

## Workflow 1 — Receive Cargo Through a New World Cargo Origin Office

This is the primary customer workflow and should be the first start option for customers without active cargo.

| Stage | Customer action | Information required from the customer | New World Cargo action / resulting state |
|---|---|---|---|
| 1. Start expected cargo | Select **Receive cargo**. | None before starting. | Opens a new expected-cargo record. |
| 2. Choose origin | Answer: “Where is New World Cargo collecting this cargo from?” | Origin office/market: China, Dubai, Zambia, or another supported location. | Shows the correct New World Cargo receiving-office instructions. |
| 3. Choose destination | Answer: “Where should this cargo go?” | Destination country/city and, if already known, collection or delivery preference. | Determines the forwarding route and final-mile possibilities. |
| 4. Provide debit note | Add the debit note used to keep the cargo information intact. | Debit-note number and/or upload; any reference needed by the business to match the physical parcel. | The expected-cargo record becomes identifiable before origin registration. |
| 5. Share office instructions | Send the origin office details to the supplier. | No additional cargo-type questions are required. | The app presents the origin office address and the customer’s matching reference. |
| 6. Origin registration | Wait for the supplier’s parcel to arrive at the origin office. | No action unless matching information is missing. | Office updates status to **Received at origin office** after physical registration. |
| 7. Forwarding | Follow movement to the destination. | No action unless support requests clarification. | Status progresses through **Registered → Prepared for dispatch → In transit → Arrived at destination warehouse**. |
| 8. Arrival notification | Review the arriving cargo and final fulfilment choice. | Confirm collection, local delivery address, or onward destination. | Cargo is warehoused and the owner is notified that it is available. |
| 9. Final charges | Review and pay the debit/final charge when the service amount is known. | Selected payment method or wallet funds. | Payment is recorded; cargo becomes eligible for release or delivery according to business policy. |
| 10. Completion | Collect cargo or receive the delivery. | Confirmation only if required. | Status changes to **Collected** or **Delivered**; receipt is stored in the wallet. |

### Information We Should *Not* Force the Customer to Enter

The customer does not need to classify a parcel as “shopping,” “gift,” “documents,” or another generic courier category before New World Cargo can start the process. The essential customer inputs are the **origin office**, **destination**, and **debit note/reference**. Parcel measurement, handling, and detailed registration can be completed when the physical cargo is received by the origin office.

## Workflow 2 — Send Cargo From a New World Cargo Collection Point

This is the secondary workflow for a customer who wants New World Cargo to collect cargo from Zambia or another supported origin and send it elsewhere.

| Stage | Customer action | Information required | Result |
|---|---|---|---|
| 1. Start cargo movement | Select **Send cargo**. | Origin collection market/office. | Opens an outbound cargo request. |
| 2. Set route | Select pickup location and destination. | Pickup address or New World Cargo office, destination country/city, destination contact if needed. | Route and serviceability are checked. |
| 3. Provide debit note | Add the reference that keeps the shipment information intact. | Debit note / booking reference. | Cargo can be matched at collection or office intake. |
| 4. Handover | Arrange pickup or deliver cargo to the selected office. | Pickup availability or office handover confirmation. | Cargo is registered and forwarded. |
| 5. Track and complete | Follow the same milestones as incoming cargo. | Final delivery choice and payment once final charges are ready. | Cargo is delivered, collected, or forwarded onward. |

## Destination Fulfilment Choices

After cargo reaches the destination warehouse, the owner should see only the options that the current route supports.

| Owner choice | When it is shown | Result |
|---|---|---|
| **Collect from warehouse/branch** | Cargo is available at a local New World Cargo warehouse. | The owner receives collection details after final charges are settled. |
| **Deliver locally** | Local delivery is available at the destination. | The owner confirms a local address and delivery note; New World Cargo schedules final-mile delivery. |
| **Forward onward** | The cargo is continuing to another city or country, including a regional destination such as Zimbabwe. | The owner confirms the onward destination; New World Cargo creates the next delivery leg while keeping a single cargo record. |

## Cargo Statuses That the Customer Should Understand

| Operational status | Customer-facing label | What the customer should do |
|---|---|---|
| Expected cargo created | **Waiting for supplier to send** | Share the New World Cargo origin-office instructions with the supplier. |
| Origin office receives cargo | **Received at China/Dubai/Zambia office** | Check that the debit note/reference is correctly attached. |
| Cargo registered | **Registered and preparing to move** | No action normally required. |
| Cargo moving | **In transit to destination** | Track progress. |
| Cargo arrives | **Arrived and stored at destination warehouse** | Choose collection, local delivery, or onward delivery. |
| Final charge ready | **Final charge is ready** | Review and pay the amount due. |
| Final-mile service | **Ready for collection** or **Out for delivery** | Collect cargo or follow local delivery status. |
| Service completed | **Collected** or **Delivered** | View receipt and completed shipment record. |

## How the Existing UI Should Behave

The current layout can remain. The workflow needs to drive the labels, order, and destinations of the existing actions.

| Current UI area | Correct cargo-workflow meaning | Required logic, not a design change |
|---|---|---|
| **Four action cards for customers with active cargo** | Track cargo, choose collection/delivery, pay final charge, get help with a debit note or registration. | Each card opens the current cargo’s next eligible action. |
| **Four action cards for customers with no active cargo** | Receive cargo, send cargo, track/link cargo, get help with debit note. | Use the same cards with contextual labels; **Receive cargo** is the primary accent action. |
| **Next delivery / active cargo card** | The cargo owner’s nearest important milestone. | Shows “Waiting for supplier,” “In transit,” “Arrived,” or “Final charge ready,” depending on current state. |
| **Track another package** | Find an expected cargo or registered cargo. | Search by New World Cargo reference, debit-note number, or operational tracking number. |
| **Pay balance** | Pay final charge. | Opens the cargo’s final invoice and wallet/payment step after the amount is issued. |
| **Add delivery note** | Choose collection, local delivery, or onward delivery after arrival. | Remains unavailable until cargo reaches an appropriate warehouse milestone. |
| **Send Shipment screen** | Start a cargo request after selecting “Receive cargo” or “Send cargo.” | The first step becomes origin/destination/debit-note capture; existing stepper can then guide the remaining service details. |
| **Quote screen** | A supporting estimate where the business chooses to show one. | It must not block expected-cargo registration; the authoritative final charge is issued at end of service. |
| **Shipment detail / notifications / wallet** | Cargo control, arrivals, documents, final charges, and fulfilment selection. | The status determines which action is shown and whether it is enabled. |

## Minimum Future System Logic

| Record | Minimum fields | Why it is needed |
|---|---|---|
| **Expected cargo** | Cargo owner, origin office, destination, debit-note reference, customer reference, fulfilment preference. | Creates the digital record before physical cargo reaches an origin office. |
| **Cargo record** | Expected-cargo link, origin registration date, operational tracking code, current warehouse, lifecycle status, final destination. | Links physical registration and transport events to the customer’s app view. |
| **Cargo events** | Event type, timestamp, office/warehouse, customer-facing message, next action. | Powers tracking, Home priority cards, and notifications. |
| **Final fulfilment request** | Collection, local delivery, or onward forwarding; address/contact where required. | Allows the owner to decide what happens after arrival. |
| **Charge and wallet transaction** | Cargo record, final amount, invoice/debit note, due status, payment receipt. | Presents and records end-of-service charges. |

## Recommended Next Implementation Step

Keep the existing UI design and make the workflow state-aware. Implement a small start-flow decision at the point where a customer begins new cargo:

1. **Receive cargo** or **Send cargo**.
2. Select the **origin office** and **destination**.
3. Add the **debit note/reference**.
4. Create the expected-cargo record.

Everything else in the current app—tracking, arrival alerts, fulfilment choice, and final payment—then follows the physical cargo lifecycle rather than a generic courier form.
