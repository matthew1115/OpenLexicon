export function createWelcomePage(): HTMLElement {
    // Create main container for welcome content
    const container = document.createElement('div');
    container.className = 'bg-gray-50 w-full flex flex-col items-center';

    container.innerHTML = `
        <h1 class="text-4xl font-bold text-gray-800 mb-10">OpenLexicon</h1>
        <div class="flex flex-col gap-5 w-full">
            <mdui-button 
                variant="filled" 
                class="w-full py-4 px-8 text-lg font-medium"
                id="resume-learning-btn">
                Resume Learning
            </mdui-button>
            <mdui-button 
                variant="outlined" 
                class="w-full py-4 px-8 text-lg font-medium"
                id="open-wordbank-btn">
                Open Wordbank
            </mdui-button>
        </div>
    `;

    // Add event listeners for buttons
    const resumeLearningBtn = container.querySelector('#resume-learning-btn');
    const openWordbankBtn = container.querySelector('#open-wordbank-btn');

    resumeLearningBtn?.addEventListener('click', () => {
        console.log('Resume Learning clicked');
        // Add your resume learning logic here
    });

    openWordbankBtn?.addEventListener('click', () => {
        console.log('Open Wordbank clicked');
        // Add your open wordbank logic here
    });

    return container;
}
