import * as React from "react";
import {DragDropContext, Droppable, Draggable} from "react-beautiful-dnd";
import {useDocument} from "react-firebase-hooks/firestore";
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import Typeogrophy from '@mui/material/Typography';

import {Card, EmptyCard} from "./Card";
import {Library} from "./Library";

import {playerStateDoc, PlayerState, CARD_BUCKETS} from "../../firebase-interop/models/playerState";
import type {Game} from "../../firebase-interop/models/game";
import type {DropResult} from "react-beautiful-dnd";

type Props = {
    game: Game;
    uid: string;
}

function StackedCardsLayout({
    cardsId,
    title,
    playerState,
    bucket,
}: {
    cardsId: Array<string>,
    title: React.ReactNode,
    playerState: PlayerState,
    bucket: CARD_BUCKETS,
}) {
    const top = cardsId[cardsId.length - 1];

    return (
        <Grid container direction="column" alignItems="center">
            <Typeogrophy variant="body1">{title} ({cardsId.length})</Typeogrophy>
            <Grid container alignContent="center">
                <Grid>
                    {top ? <Card player={playerState} scryfallId={top} bucket={bucket} />: <EmptyCard/>}
                </Grid>
            </Grid>
        </Grid>
    );
}

function Exile({playerState}: {playerState: PlayerState}) {
    // TODO(miguel): wire in cards that are in the exile bucket
    const cardsId = playerState.exileCardIds;

    return (
        <StackedCardsLayout title="Exile" cardsId={cardsId} playerState={playerState} bucket="exile"/>
    );
}

function Graveyard({playerState}: {playerState: PlayerState}) {
    // TODO(miguel): wire in cards that are in the graveyard bucket
    const cardsId = playerState.graveyardCardIds;

    return (
        <StackedCardsLayout title="Graveyard" cardsId={cardsId} playerState={playerState} bucket="graveyard"/>
    );
}

function ListCardsLayout({
    cardsId,
    bucket,
    title,
    playerState,
}: {
    cardsId: Array<string>,
    bucket: CARD_BUCKETS,
    title: React.ReactNode,
    playerState: PlayerState,
}) {
    return (
        <Grid container direction="column" alignContent="center">
            <Typeogrophy variant="body1">{title} ({cardsId.length})</Typeogrophy>
            <Droppable droppableId={bucket}>
                {(provided) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                        <Grid container justifyContent="center">
                            {cardsId.length ? cardsId.map((cardId, i) =>
                                <Draggable key={cardId} draggableId={cardId} index={i}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <Grid container justifyContent="center">
                                                <Card player={playerState} scryfallId={cardId} bucket={bucket} />
                                                {cardsId.length !== 1 && cardsId.length - 1 !== i ?
                                                    <Divider
                                                        sx={{width: "1em", visibility: "hidden"}}
                                                        orientation="horizontal"/> :
                                                    null
                                                }
                                            </Grid>
                                        </div>
                                    )}
                                </Draggable>
                            ) : <EmptyCard/>}
                        </Grid>
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </Grid>
    );
}

function Lands({playerState}: {playerState: PlayerState}) {
    // TODO(miguel): either add a new bucket in player state for lands or
    // out by card type. Needs to take into consideration any spells
    // that turn things into land.  We need to test if we want _all_ lands
    // or only lands that have a natural type of land.
    const cardIds = playerState.landCardIds;
    return (
        <ListCardsLayout title="Lands" playerState={playerState} cardsId={cardIds} bucket="land"/>
    );
}

function Battleground({playerState}: {playerState: PlayerState}) {
    const cardIds = playerState.battlefieldCardIds;
    return (
        <ListCardsLayout title="Battleground" playerState={playerState} cardsId={cardIds} bucket="battlefield" />
    );
}

function Hand({playerState}: {playerState: PlayerState}) {
    const cardIds = playerState.handCardIds;
    return (
        <ListCardsLayout title="Hand" playerState={playerState} cardsId={cardIds} bucket="hand"/>
    );
}

export function GameBoard({game, uid}: Props) {
    const [playerStateDocReference, loading] = useDocument(playerStateDoc(game.id!)(uid));

    if (loading) {
        return <div>Loading...</div>;
    }

    const playerState = playerStateDocReference?.data();
    if (!playerState) {
        return <div>Bad bad.</div>;
    }

    const onDragEnd = (result: DropResult) => {
        const {destination, source, draggableId} = result;

        if (!destination) {
            return;
        }

        if (destination.droppableId === source.droppableId &&
            destination.index === source.index) {
            return;
        }

        if (source.droppableId !== destination.droppableId) {
            // Moving cards between buckets
            playerState.moveCard(draggableId, source.droppableId as CARD_BUCKETS, destination.droppableId as CARD_BUCKETS);
            playerState.save();
        } else {
            // Reordering cards in the same bucket
            playerState.reorderCard(draggableId, source.droppableId as CARD_BUCKETS, destination.index);
            playerState.save();
        }
    };

    // TODO(miguel): wire up custom layouts here where we can swap the
    // graveyard from left to right. And permanents from top to bottom.
    // This will be done by simply applying `row` or `row-reverse`
    // and `column` and `column-reverse` in the grid containers below.
    // For the graveyard and exile container, you can use column instead
    // of row and the will be aligned verically instead of horizontally.
    // We will wire this up later.
    const graveyardLayout = "column";
    const permanentCreaturesLayout = "column-reverse";

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <h1>{game.name}</h1>
            <Library game={game} player={playerState} />
            <Grid container
                direction="row"
                columns={{ xs: 4, sm: 8, md: 12 }}
                padding="0 2em"
            >
                <Grid container direction={graveyardLayout} justifyContent="center" alignItems="center">
                    <Exile playerState={playerState}/>
                    <Divider sx={{width: "1em", visibility: "hidden"}}/>
                    <Graveyard playerState={playerState}/>
                </Grid>
                <Grid container direction="column" flex="1">
                    <Grid container direction={permanentCreaturesLayout} flex="1">
                        <Lands playerState={playerState} />
                        <Battleground playerState={playerState} />
                    </Grid>
                    <Hand playerState={playerState} />
                </Grid>
            </Grid>
        </DragDropContext>
    );
}
