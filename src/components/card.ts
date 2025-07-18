import type { Card } from 'mdui/components/card.js';

export function createCard(inputElement: HTMLElement): Card {
    const card = document.createElement('mdui-card') as Card;
    card.appendChild(inputElement);
    return card;
}