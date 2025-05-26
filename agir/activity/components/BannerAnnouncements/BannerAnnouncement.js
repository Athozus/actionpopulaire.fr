import styled, {keyframes} from "styled-components";
import {
    answerToBannerAnnouncement, closeBannerAnnouncement,
    useActiveBannerAnnouncement
} from "@agir/activity/BannerAnnouncements/useBannerAnnouncements";
import React, {useEffect, useState} from "react"
import Button from "@agir/front/genericComponents/Button";
import {useMutate} from "@agir/front/app/apiHook";
import Spinner from "@agir/front/genericComponents/Spinner";
import {useTransition, animated} from "@react-spring/web";

const BackgroundAnimation = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
`

const Banner = styled.div`
    position: relative;
    width: 100vw;
    min-height: 150px;
    background-color: ${(props) => props.theme.primary500};
    color: ${(props) => props.theme.text25};
    flex-direction: column;
    align-items: center;
    align-content: center;
    text-align: center;
    
    animation-name: ${BackgroundAnimation};
    animation-duration: 1.4s;
    animation-timing-function: ease;
    animation-fill-mode: forwards;
    
    h3 {
        font-weight: bold;
    }
    h2, h3, h4 {
        text-align: center;
        color: ${(props) => props.theme.text25};
        margin-bottom: 0.7em;
        font-size: 1.2em;
        margin-top: 0;
        padding-top: 0.7em; 
    }
    span {
        max-width: 800px;
        a {
            color: ${(props) => props.theme.text25};
            text-decoration: underline;
        }
    }

    @media (max-width: 700px) {
        p {
            text-align: center;
            padding-top: 2px;
            padding-right: 12px;
            padding-left: 12px;
        }
        h2, h3, h4 {
            margin-bottom: 0.2em;

        }
    }
`
const Answers = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 0.5em;
    height: 2.8em;
    padding-top: 0.1em;
    padding-bottom: 0.5em;
    justify-content: center;

    @media (max-width: 600px) {
        flex-direction: column;
        margin-bottom: 0.7em;
        height: auto;
    }
`
const BannerAnnouncementDone = styled.div`
    width: 100vw;
    min-height: 150px;
    background-color: #17a460;
    
    animation-name: ${BackgroundAnimation};
    animation-duration: 1.4s;
    animation-timing-function: ease;
    animation-fill-mode: forwards;
`

const Close = styled.div`
    position: absolute;
    top: 8px;
    right: 15px;
    
    cursor: pointer;
    
    font-size: 1.5em;
`

export default function BannerAnnouncement() {
    const [currentAnnouncement, setCurrentAnnouncement] = useState()
    const [done, setDone] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState()

    const [announcementsHandled, setAnnouncementsHandled] = useState([])

    const {data: announcements, mutate: refresh} = useActiveBannerAnnouncement()
    const {mutate: mutateAnswer, isLoading, error} = useMutate(answerToBannerAnnouncement, () => {
        setDone(true)
    })

    const transitions = useTransition(announcements?.length > 0 || !!currentAnnouncement, {
        from: { opacity: 0 },
        enter: { opacity: 1 },
        leave: { opacity: 0 },
        config: {duration: 1300}
    });

    useEffect(() => {
        const announcement = announcements?.[0]
        if (announcement && !announcementsHandled.includes(announcement?.id) && !done) {
            setCurrentAnnouncement(announcement)
        }
    }, [announcementsHandled, announcements, done]);

    async function userAnswer(answer) {
        setSelectedAnswer(answer)
        await mutateAnswer(currentAnnouncement.id, answer.id)
        await refresh()
    }

    function AnnouncementDone() {
        return <BannerAnnouncementDone>
                <h4>{currentAnnouncement.question} {selectedAnswer.name} <i className="fa fa-circle-check"/></h4>
                <p dangerouslySetInnerHTML={{__html: currentAnnouncement.afterMessage}}/>

                <Button small onClick={nextAnnouncement}>Fermer</Button>
            </BannerAnnouncementDone>
    }

    async function nextAnnouncement() {
        await refresh()
        setAnnouncementsHandled((prev) => {
            return [...prev, currentAnnouncement.id];
        })
        setCurrentAnnouncement(undefined)
        setDone(false)
    }

    async function closeAnnouncement() {
        if (currentAnnouncement) {
            const result = await closeBannerAnnouncement(currentAnnouncement.id);
            if (result.status === 204) {
                await nextAnnouncement()
            }
        }
    }

    const hasAnswers = !!currentAnnouncement?.answers?.length
    return <>
        {transitions((style, item) => {
                return item && (
                    <animated.div style={style}>
                        <Banner>
                            {!currentAnnouncement ? <Spinner/> : done ? <AnnouncementDone/> : <>
                                <h3>{currentAnnouncement.title}</h3>
                                {isLoading ? <Spinner/> : hasAnswers && <Answers>
                                    {currentAnnouncement.question && <h4>{currentAnnouncement.question}</h4>}
                                    {
                                        currentAnnouncement.answers?.map((answer) => {
                                            return <Button small onClick={() => userAnswer(answer)}
                                                           key={answer.name}>{answer.name}</Button>
                                        })
                                    }
                                </Answers>}
                                {!isLoading &&
                                    <span dangerouslySetInnerHTML={{__html: currentAnnouncement.description}}/>}
                            </>}
                            {!hasAnswers && <Close onClick={closeAnnouncement}><i className="fa fa-xmark"/></Close>}
                        </Banner>
                    </animated.div>
                );
            }
        )}
    </>
}
