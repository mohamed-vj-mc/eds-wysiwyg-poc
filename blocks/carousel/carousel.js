import { fetchPlaceholders } from '../../scripts/aem.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');

  slides.forEach((aSlide, idx) => {
    const isActive = idx === slideIndex;
    aSlide.setAttribute('aria-hidden', !isActive);

    // Gestione dei video
    const videos = aSlide.querySelectorAll('video');
    videos.forEach((video) => {
      if (isActive) {
        video.play();
      } else {
        video.pause();
        video.currentTime = 0; // Resetta il video quando lo slide non è attivo
      }
    });

    // Gestione dei link
    aSlide.querySelectorAll('a').forEach((link) => {
      if (!isActive) {
        link.setAttribute('tabindex', '-1');
      } else {
        link.removeAttribute('tabindex');
      }
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    if (idx !== slideIndex) {
      indicator.querySelector('button').removeAttribute('disabled');
    } else {
      indicator.querySelector('button').setAttribute('disabled', 'true');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex < 0 ? slides.length - 1 : slideIndex;

  if (slideIndex >= slides.length) {
    realSlideIndex = 0;
  }

  const activeSlide = slides[realSlideIndex];

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  block.querySelector('.carousel-slides').scrollTo({
    top: 0,
    left: activeSlide.offsetLeft,
    behavior: 'smooth',
  });
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (slideIndicators) {
    slideIndicators.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const slideIndicator = e.currentTarget.parentElement;
        showSlide(block, parseInt(slideIndicator.dataset.targetSlide, 10));
      });
    });
  }

  block.querySelector('.slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });

  block.querySelector('.slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });

  // Gestione della barra espandibile e del contenuto
  block.querySelectorAll('.carousel-slide-expandable-bar.expand-toggle').forEach((expandableBar) => {
    expandableBar.addEventListener('click', () => {
      const expandableContent = expandableBar.querySelector('.expandable-content');
      const isExpanded = expandableContent.classList.contains('expanded');

      if (isExpanded) {
        expandableContent.classList.remove('expanded');
        expandableContent.style.maxHeight = '0';
        expandableContent.style.opacity = '0';
        expandableBar.querySelector('.expandable-icon').style.transform = 'rotate(0)';
      } else {
        expandableContent.classList.add('expanded');
        expandableContent.style.maxHeight = '500px'; // Adatta come necessario
        expandableContent.style.opacity = '1';
        expandableBar.querySelector('.expandable-icon').style.transform = 'rotate(45deg)';
      }
    });
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) updateActiveSlide(entry.target);
    });
  }, { threshold: 0.5 });

  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  const columns = row.querySelectorAll(':scope > div');

  // Check if we have 4 columns
  if (columns.length === 4) {
    const imageColumn = columns[0];
    const contentColumn = columns[1];
    const ctaColumn = columns[2];
    const descriptionColumn = columns[3];

    // Handle the image
    imageColumn.classList.add('carousel-slide-image');
    slide.append(imageColumn);

    // Create the expandable bar
    const expandableBar = document.createElement('div');
    expandableBar.classList.add('carousel-slide-expandable-bar');

    // Create the button with initial + sign
    const toggleButton = document.createElement('button');
    toggleButton.classList.add('expand-toggle');
    toggleButton.innerHTML = '<span class="expandable-icon">+</span>';

    // Add initial text from the second column
    const initialText = document.createElement('span');
    initialText.classList.add('expand-text');
    initialText.textContent = contentColumn.textContent;

    // Add content to expandable bar
    expandableBar.append(toggleButton, initialText);

    // Handle the expandable content
    const expandableContent = document.createElement('div');
    expandableContent.classList.add('expandable-content');
    expandableContent.style.maxHeight = '0'; // Initially hidden
    expandableContent.style.opacity = '0';

    // Append the third column's content to the expanded section
    const expandedTitle = document.createElement('h3');
    expandedTitle.textContent = ctaColumn.textContent;

    // Append the fourth column's content as a description
    const expandedDescription = document.createElement('p');
    expandedDescription.textContent = descriptionColumn.textContent;

    expandableContent.append(expandedTitle, expandedDescription);

    // Append expandable content inside expandable bar
    expandableBar.append(expandableContent);
    slide.append(expandableBar);

    // Add click event to toggle the expandable section
    toggleButton.addEventListener('click', () => {
      const isExpanded = expandableContent.classList.contains('expanded');

      // Toggle visibility
      expandableContent.classList.toggle('expanded');
      expandableContent.style.maxHeight = isExpanded ? '0' : '500px';
      expandableContent.style.opacity = isExpanded ? '0' : '1';

      // Toggle button text between + and -
      toggleButton.innerHTML = isExpanded ? '<span class="expandable-icon">+</span>' : '<span class="expandable-icon">-</span>';

      // Toggle the text in the expandable bar
      initialText.textContent = isExpanded ? contentColumn.textContent : ctaColumn.textContent;
    });
  } else {
    // Handle standard 2-column layout
    columns.forEach((column, colIdx) => {
      column.classList.add(`carousel-slide-${colIdx === 0 ? 'image' : 'content'}`);
      slide.append(column);
    });
  }

  const labeledBy = slide.querySelector('h1, h2, h3, h4, h5, h6');
  if (labeledBy) {
    slide.setAttribute('aria-labelledby', labeledBy.getAttribute('id'));
  }

  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  const rows = block.querySelectorAll(':scope > div');
  const isSingleSlide = rows.length < 2;

  const placeholders = await fetchPlaceholders();

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');

    container.append(slideNavButtons);
  }

  rows.forEach((row, idx) => {
    const slide = createSlide(row, idx, carouselId);
    slidesWrapper.append(slide);

    if (slideIndicators) {
      const indicator = document.createElement('li');
      indicator.classList.add('carousel-slide-indicator');
      indicator.dataset.targetSlide = idx;
      indicator.innerHTML = `<button type="button" aria-label="${placeholders.showSlide || 'Show Slide'} ${idx + 1} ${placeholders.of || 'of'} ${rows.length}"></button>`;
      slideIndicators.append(indicator);
    }
    row.remove();
  });

  container.append(slidesWrapper);
  block.prepend(container);

  if (!isSingleSlide) {
    bindEvents(block);
  }
}
