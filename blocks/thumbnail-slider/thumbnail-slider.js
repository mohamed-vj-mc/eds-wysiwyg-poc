export default async function decorate(block) {
    // Create the main container for the slider
    const container = document.createElement('div');
    container.classList.add('thumbnail-slider-container');

    // Create the selected container
    const selectedContainer = document.createElement('div');
    selectedContainer.classList.add('selected-container');

    const selectedImage = document.createElement('div');
    selectedImage.classList.add('selected-image');

    const selectedHeading = document.createElement('div');
    selectedHeading.classList.add('selected-heading');

    const selectedDescription = document.createElement('div');
    selectedDescription.classList.add('selected-description');

    selectedContainer.append(selectedImage, selectedHeading, selectedDescription);
    container.append(selectedContainer);

    const thumbnailsContainer = document.createElement('div');
    thumbnailsContainer.classList.add('thumbnails-container');

    const thumbnails = document.createElement('div');
    thumbnails.classList.add('thumbnails');
    
    const rows = block.querySelectorAll(':scope > div');
    rows.forEach((row, index) => {
        const columns = row.querySelectorAll(':scope > div');
        const thumbnail = columns[0].cloneNode(true);
        thumbnail.classList.add('thumbnail');
        
        // Event listener to update the selected container
        thumbnail.addEventListener('click', () => {
            updateSelectedContent(columns[0], columns[1]?.innerText, columns[2]?.innerText);
        });

        thumbnails.append(thumbnail);
        
        if (index === 0) {
            // Set the first thumbnail as the default selected
            updateSelectedContent(columns[0], columns[1]?.innerText, columns[2]?.innerText);
        }

        row.remove();
    });

    thumbnailsContainer.append(thumbnails);
    container.append(thumbnailsContainer);
    block.prepend(container);

    // Helper function to update the selected content
    function updateSelectedContent(image, heading, description) {
        selectedImage.innerHTML = '';
        selectedImage.appendChild(image.cloneNode(true));
        selectedHeading.textContent = heading ?? '';
        selectedDescription.textContent = description ?? '';
    }
}