import './Roguedivers.css'
import { useArmory } from './data/Armory'
import { ArmoryView } from './components/Armory/ArmoryView'
import { usePlayer } from './data/Player'
import { PlayerView } from './components/Player/PlayerView'
import { MilestonePicker } from './components/Player/MilestonePicker'
import { DeathFlow } from './components/Player/DeathFlow'
import { MissionResults } from './components/Player/MissionResults'
import { FactionTracker } from './components/Player/FactionTracker'
import { MissionHistoryLog } from './components/Player/MissionHistoryLog'
import type { ArmoryData } from './types/Objects'

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
                    <ArmoryView armory={armory.armory} onToggle={armory.toggleItemAvailable} onRefresh={armory.refreshArmory} />
                </>
            }
        </div>
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
                    <FactionTracker player={player.player} onUpdate={player.updatePlayer}/>
                    <PlayerView player={player.player} armory={armory} onUpdate={player.updatePlayer}/>
                    <MissionResults player={player.player} armory={armory} onUpdate={player.updatePlayer}/>
                    <MissionHistoryLog player={player.player}/>
                    <DeathFlow onUpdate={player.updatePlayer}/>
                    <MilestonePicker player={player.player} armory={armory} onUpdate={player.updatePlayer}/>
                </>}
        </>
    )
}

export default App