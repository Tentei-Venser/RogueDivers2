import './Roguedivers.css'
import { useArmory } from './data/Armory'
import { ArmoryView } from './components/Armory/ArmoryView'
import { usePlayer } from './data/Player'
import { PlayerView } from './components/Player/PlayerView'
import { MilestonePicker } from './components/Player/MilestonePicker'
import { DeathFlow } from './components/Player/DeathFlow'
import { MissionResults } from './components/Player/MissionResults'
import { MissionHistoryLog } from './components/Player/MissionHistoryLog'
import { QuickstartView } from './components/Player/QuickstartView'
import type { ArmoryData } from './types/Objects'
import { useState } from 'react'

declare const __APP_VERSION__: string
declare const __DATA_VERSION__: string
declare const __COMMIT_SHA__: string

function App() {

    const armory = useArmory();
    return (
        <div>
            <h1>Roguedivers II Companion App</h1>
            {armory.status === "loading" && <p>Loading armory...</p>}
            {armory.status === "error" && <p>Failed to load armory data.</p>}
            {(armory.status === "fresh" || armory.status === "cached") 
                && <>
                    <PlayerSection armory={armory.armory} />
                    <ArmoryView armory={armory.armory} 
                        onToggle={armory.toggleItemAvailable} 
                        onRefresh={armory.refreshArmory} 
                        onSelectAll={armory.selectAllItems}
                        onDeselectAll={armory.deselectAllItems}/>
                </>
            }
            <BuildInfo />
        </div>
    )
}

function BuildInfo() {
    const [copied, setCopied] = useState(false)
    const versionInfo = `App v${__APP_VERSION__} | Data v${__DATA_VERSION__} | Commit ${__COMMIT_SHA__}`

    async function copyVersionInfo() {
        try {
            await navigator.clipboard.writeText(versionInfo)
            setCopied(true)
        } catch {
            setCopied(false)
        }
    }

    return (
        <footer className="build-info">
            <span>{versionInfo}</span>
            <button type="button" onClick={copyVersionInfo}>Copy version info</button>
            <span className="build-info-status" aria-live="polite">{copied ? "Copied" : ""}</span>
        </footer>
    )
}

function PlayerSection({armory}: {armory:ArmoryData}){
    const player = usePlayer();

    return (
        <>
            {player.status === "loading" && <p>Loading player...</p>}
            {player.status === "error" && <p>Failed to load player data.</p>}
            {player.status === "ready"
                && <>
                    <div className="player-panels">
                        <PlayerView player={player.player} armory={armory} onUpdate={player.updatePlayer}/>
                        <QuickstartView />
                    </div>
                    <MissionResults player={player.player} armory={armory} onUpdate={player.updatePlayer}/>
                    <MissionHistoryLog player={player.player}/>
                    <DeathFlow onUpdate={player.updatePlayer}/>
                    <MilestonePicker player={player.player} armory={armory} onUpdate={player.updatePlayer}/>
                </>}
        </>
    )
}

export default App