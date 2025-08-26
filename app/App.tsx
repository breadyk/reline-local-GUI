import React from 'react';
import HomePage from "./components/home-page"
import {ThemeProvider} from "~/context/theme-provider.tsx";

function App() {
    return (
        <ThemeProvider>
            <div>
                <HomePage/>
            </div>
        </ThemeProvider>
    );
}

export default App;
