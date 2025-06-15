document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const productGrid = document.getElementById('productGrid');
    const bankDetailsModal = document.getElementById('bankDetailsModal');
    const mainHeader = document.getElementById('mainHeader');

    // Bank Details Modal specific buttons
    const closeBankDetailsModal = document.getElementById('closeBankDetailsModal');
    const okBankDetailsButton = document.getElementById('okBankDetails');
    const finalAmountPayableSpan = document.getElementById('finalAmountPayable');
    const downloadPdfButton = document.getElementById('downloadPdfButton'); // Download PDF button

    // Bank Details elements for PDF (ensure these IDs exist in HTML)
    const bankAccountNumber = document.getElementById('bankAccountNumber');
    const bankName = document.getElementById('bankName');
    const bankBranch = document.getElementById('bankBranch');
    const bankAccountName = document.getElementById('bankAccountName');

    // Cart and Header elements
    const viewCartButton = document.getElementById('viewCartButton');
    const cartDropdown = document.getElementById('cartDropdown');
    const cartItemCountSpan = document.getElementById('cartItemCount');
    const cartItemsListDiv = document.getElementById('cartItemsList');
    const cartTotalSpan = document.getElementById('cartTotal');
    const proceedToCheckoutButton = document.getElementById('proceedToCheckoutButton');
    const clearCartButton = document.getElementById('clearCartButton');

    // Search input element
    const searchInput = document.querySelector('header input[type="text"]');

    // For debugging:
    console.log('--- DOM Content Loaded: Script Initialization ---');
    console.log('Elements initialized:', {
        productGrid: !!productGrid,
        mainHeader: !!mainHeader,
        viewCartButton: !!viewCartButton,
        cartDropdown: !!cartDropdown,
        bankDetailsModal: !!bankDetailsModal,
        searchInput: !!searchInput,
        downloadPdfButton: !!downloadPdfButton,
        bankAccountNumber: !!bankAccountNumber,
        bankName: !!bankName,
        bankBranch: !!bankBranch,
        bankAccountName: !!bankAccountName
    });
    console.log('-------------------------------------------------');


    // --- State Variables ---
    let cart = []; // Array to store items in the cart (for "Add to Cart" and "Proceed to Checkout")
    let currentTotalAmount = 0;
    // This array will hold the items relevant for the *current* PDF download.
    // It's populated differently for single "Buy Now" vs. "Proceed to Checkout".
    let itemsForPdf = [];


    // --- Helper Functions ---

    function showElement(element) {
        if (!element) { console.error('showElement called with null element.'); return; }
        console.log('Showing element:', element.id || element.className);
        element.classList.remove('hidden');
        requestAnimationFrame(() => { element.classList.add('active'); });
    }

    function hideElement(element) {
        if (!element) { console.error('hideElement called with null element.'); return; }
        console.log('Hiding element:', element.id || element.className);
        element.classList.remove('active');
        setTimeout(() => { element.classList.add('hidden'); }, 300);
    }

    function formatCurrency(amount) {
        return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Function to update the cart UI and total
    function updateCartUI() {
        console.log('Updating cart UI...');
        if (!cartItemsListDiv) { console.error('cartItemsListDiv not found for updating cart UI.'); return; }
        cartItemsListDiv.innerHTML = ''; // Clear current items
        currentTotalAmount = 0;

        if (cart.length === 0) {
            cartItemsListDiv.innerHTML = '<p class="text-gray-400 text-sm">Your cart is empty.</p>';
            if (proceedToCheckoutButton) { proceedToCheckoutButton.disabled = true; }
            if (clearCartButton) { clearCartButton.classList.add('hidden'); }
        } else {
            if (proceedToCheckoutButton) { proceedToCheckoutButton.disabled = false; }
            if (clearCartButton) { clearCartButton.classList.remove('hidden'); }
            cart.forEach((item, index) => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('flex', 'justify-between', 'items-center', 'py-2', 'border-b', 'border-gray-700', 'last:border-b-0');
                itemElement.innerHTML = `
                    <span class="text-gray-200 text-sm">${item.name}</span>
                    <div class="flex items-center">
                        <span class="text-gray-200 text-sm mr-2">${formatCurrency(item.price)}</span>
                        <button class="remove-item-button bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-full" data-index="${index}">Remove</button>
                    </div>
                `;
                cartItemsListDiv.appendChild(itemElement);
                currentTotalAmount += item.price;
            });
        }

        if (cartItemCountSpan) { cartItemCountSpan.textContent = cart.length; }
        if (cartTotalSpan) { cartTotalSpan.textContent = formatCurrency(currentTotalAmount); }
        // finalAmountPayableSpan is updated specifically when showing bankDetailsModal
        console.log('Cart UI updated. Items in persistent cart:', cart.length, 'Current Persistent Total:', currentTotalAmount);
    }

    // --- PDF Generation Function ---
    async function generatePdf() {
        console.log('Initiating PDF generation...');
        // Ensure jsPDF is loaded
        if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
            console.error('jsPDF library not loaded. Please ensure it is included in your HTML before script.js');
            alert('PDF generation library not loaded. Please try again or refresh the page.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Use the itemsForPdf array, which is set just before showing the modal
        console.log('Items for PDF generation:', JSON.stringify(itemsForPdf));
        const totalForPdf = parseFloat(finalAmountPayableSpan.textContent.replace('LKR ', '').replace(',', ''));
        console.log('Total for PDF generation:', totalForPdf);

        // Add title
        doc.setFontSize(22);
        doc.text("Payment Details Summary", 105, 20, null, null, "center");

        // Add Shopping Cart Items details
        doc.setFontSize(16);
        doc.text("Shopping Cart Items:", 20, 40);
        let y = 50;

        if (itemsForPdf.length === 0) {
            doc.setFontSize(12);
            doc.text("No items selected for this transaction.", 20, y);
            y += 10;
        } else {
            doc.setFontSize(12);
            itemsForPdf.forEach(item => {
                doc.text(`${item.name}: ${formatCurrency(item.price)}`, 20, y);
                y += 7;
            });
        }

        y += 10; // Add some space
        doc.setFontSize(16);
        doc.text(`Total Amount Payable: ${formatCurrency(totalForPdf)}`, 20, y);

        // Add Bank Details
        y += 20;
        doc.setFontSize(16);
        doc.text("Bank Transfer Details:", 20, y);
        y += 10;

        // Ensure these elements exist before trying to read their textContent
        if (bankAccountNumber) { doc.setFontSize(12); doc.text(`${bankAccountNumber.textContent}`, 20, y); y += 7; }
        if (bankName) { doc.setFontSize(12); doc.text(`${bankName.textContent}`, 20, y); y += 7; }
        if (bankBranch) { doc.setFontSize(12); doc.text(`${bankBranch.textContent}`, 20, y); y += 7; }
        if (bankAccountName) { doc.setFontSize(12); doc.text(`${bankAccountName.textContent}`, 20, y); y += 10; }

        doc.setFontSize(12);
        doc.text("Please transfer the amount to the above account.", 20, y);
        y += 7;
        doc.text("After the transfer, please WhatsApp your payment slip to:", 20, y);
        y += 7;
        doc.text("WhatsApp: +94 77 123 4567", 20, y);


        doc.save('payment_details.pdf');
        console.log('PDF generated and downloaded.');
    }


    // --- Event Listeners ---

    // Event listener for "Add to Cart" and individual "Buy Now" buttons (delegated to parent productGrid)
    if (productGrid) {
        productGrid.addEventListener('click', (event) => {
            const addToCartButton = event.target.closest('.add-to-cart-button');
            const buyNowButton = event.target.closest('.buy-now-button');

            if (addToCartButton) {
                console.log('Event: Add to Cart button clicked.');
                const productCard = addToCartButton.closest('.product-card');
                const productName = productCard.dataset.name;
                const productPrice = parseFloat(productCard.dataset.price);

                cart.push({ name: productName, price: productPrice });
                updateCartUI();
                addToCartButton.textContent = 'Added!';
                setTimeout(() => { addToCartButton.textContent = 'Add to Cart'; }, 1000);
            } else if (buyNowButton) {
                console.log('Event: Individual "Buy Now" button clicked. Direct purchase.');
                const productCard = buyNowButton.closest('.product-card');
                const productName = productCard.dataset.name;
                const productPrice = parseFloat(productCard.dataset.price);

                // Populate itemsForPdf ONLY with the current item for direct purchase
                itemsForPdf = [{ name: productName, price: productPrice }];
                console.log('Items for PDF (Buy Now):', JSON.stringify(itemsForPdf));

                if (finalAmountPayableSpan) {
                    finalAmountPayableSpan.textContent = formatCurrency(productPrice);
                }
                
                hideElement(productGrid);
                hideElement(mainHeader);
                showElement(bankDetailsModal);
            }
        });
    } else {
        console.error('Error: productGrid element not found. Product card buttons will not be interactive.');
    }

    // Event listener for "Remove" item button (delegated to cartItemsListDiv)
    if (cartItemsListDiv) {
        cartItemsListDiv.addEventListener('click', (event) => {
            const removeItemButton = event.target.closest('.remove-item-button');
            if (removeItemButton) {
                event.stopPropagation(); // Crucial: Prevent click from bubbling and closing the dropdown
                console.log('Event: Remove item button clicked. Data index:', removeItemButton.dataset.index);
                const indexToRemove = parseInt(removeItemButton.dataset.index, 10);
                if (!isNaN(indexToRemove) && indexToRemove >= 0 && indexToRemove < cart.length) {
                    cart.splice(indexToRemove, 1);
                    updateCartUI();
                } else {
                    console.warn('Invalid index for removal:', indexToRemove);
                }
            }
        });
    } else {
        console.error('Error: cartItemsListDiv not found. Remove buttons will not be interactive.');
    }

    // Event listener for "View Cart" button (toggle dropdown)
    if (viewCartButton) {
        viewCartButton.addEventListener('click', (event) => {
            console.log('Event: View Cart button clicked. Toggling dropdown.');
            event.stopPropagation();
            if (cartDropdown) { cartDropdown.classList.toggle('hidden'); }
            else { console.error('Error: cartDropdown not found for viewCartButton click.'); }
        });
    } else {
        console.error('Error: viewCartButton element not found.');
    }


    // Event listener for "Proceed to Checkout" button in cart dropdown
    if (proceedToCheckoutButton) {
        proceedToCheckoutButton.addEventListener('click', () => {
            console.log('Event: Proceed to Checkout button clicked.');
            if (cart.length > 0) {
                itemsForPdf = [...cart]; // Clone the cart for PDF generation
                console.log('Items for PDF (Proceed to Checkout):', JSON.stringify(itemsForPdf));

                if (finalAmountPayableSpan) {
                    finalAmountPayableSpan.textContent = formatCurrency(currentTotalAmount);
                }
                hideElement(productGrid);
                if (cartDropdown) { hideElement(cartDropdown); }
                hideElement(mainHeader);
                showElement(bankDetailsModal);
            } else {
                console.warn('Proceed to Checkout clicked but cart is empty. Button should be disabled.');
            }
        });
    } else {
        console.error('Error: proceedToCheckoutButton element not found.');
    }

    // Event listener for "Clear All" button in cart dropdown
    if (clearCartButton) {
        clearCartButton.addEventListener('click', () => {
            console.log('Event: Clear All button clicked.');
            cart = [];
            updateCartUI();
        });
    } else {
        console.error('Error: clearCartButton element not found.');
    }

    // Event listener for Download PDF button
    if (downloadPdfButton) {
        downloadPdfButton.addEventListener('click', generatePdf);
    } else {
        console.error('Error: downloadPdfButton element not found.');
    }


    // Event listener for "Close" button (X) on bank details modal
    if (closeBankDetailsModal) {
        closeBankDetailsModal.addEventListener('click', () => {
            console.log('Event: Close bank details modal (X) clicked.');
            hideElement(bankDetailsModal);
            showElement(mainHeader);
            showElement(productGrid);
        });
    } else {
        console.error('Error: closeBankDetailsModal element not found.');
    }


    // Event listener for "OK" button on bank details modal
    if (okBankDetailsButton) {
        okBankDetailsButton.addEventListener('click', () => {
            console.log('Event: OK bank details button clicked.');
            hideElement(bankDetailsModal);
            cart = []; // Clear the persistent cart after "payment" is acknowledged
            updateCartUI(); // Update cart UI to reflect empty cart
            showElement(mainHeader);
            showElement(productGrid);
        });
    } else {
        console.error('Error: okBankDetailsButton element not found.');
    }


    // --- Global Click Listeners (for closing dropdowns/modals when clicked outside) ---

    // Close cart dropdown if clicked outside (but not on viewCartButton or dropdown itself)
    document.addEventListener('click', (event) => {
        if (cartDropdown && viewCartButton && !cartDropdown.contains(event.target) && !viewCartButton.contains(event.target)) {
            if (!cartDropdown.classList.contains('hidden')) {
                console.log('Event: Click outside cart dropdown. Hiding.');
                cartDropdown.classList.add('hidden');
            }
        }
    });

    // Close modals if clicked outside
    [bankDetailsModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal && !modal.classList.contains('hidden')) {
                    console.log(`Event: Clicked outside ${modal.id}. Hiding.`);
                    hideElement(modal);
                    if (modal === bankDetailsModal) {
                        showElement(mainHeader);
                        showElement(productGrid);
                    }
                }
            });
        }
    });

    // --- Search Functionality ---
    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const productCards = productGrid.querySelectorAll('.product-card');

            productCards.forEach(card => {
                const productName = card.dataset.name.toLowerCase();
                const productDescription = card.querySelector('p').textContent.toLowerCase();

                if (productName.includes(searchTerm) || productDescription.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
            console.log('Search executed for term:', searchTerm);
        });
    } else {
        console.error('Error: Search input element not found.');
    }


    // --- Initial Page Load Setup ---
    showElement(mainHeader);
    showElement(productGrid);
    updateCartUI(); // Initialize cart UI with empty cart
});
