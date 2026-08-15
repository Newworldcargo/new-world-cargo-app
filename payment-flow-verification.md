# Reusable Payment Modal Verification

The unpaid invoice detail opens the shared payment modal with the correct invoice number and amount. The modal defaults to mobile money, exposes Airtel, MTN MoMo, and Zamtel options, and provides an editable mobile number. Switching to ATM/debit card exposes cardholder name, card number, expiry, and CVV fields. The shipment wizard opens this same modal after the final review step for the K 320 booking deposit; the browser DOM confirmed the payment dialog renders after the shipment checkout control is triggered.
