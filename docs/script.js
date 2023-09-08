const synth = window.speechSynthesis

const isPrime = num => {
    if (num <= 1) return false
    if (num <= 3) return true
    if (num % 2 === 0 || num % 3 === 0) return false
    for (let i = 5; i * i <= num; i += 6) {
      if (num % i === 0 || num % (i + 2) === 0) return false
    }
    return true
}

const findNextPrime = currentPrime => {
    let nextPrime = currentPrime + 1
    while (!isPrime(nextPrime)) {
        nextPrime++
    }
    return nextPrime
}

let i = 0

let isVirgin = true
let isContinue = false

const GUI = lil.GUI
const gui = new GUI()

const paramLi = {
    voiceName: "",
    marginSec: 0.15,
    pitch: 1,
    rate: 1,
    startNum: 0,
    pause: false,
}

let voiceArr = []

let utterPrev = null

const populateVoiceList = _ => {
    if (typeof speechSynthesis === "undefined") {
        return
    }

    voiceArr = speechSynthesis.getVoices()

    if (voiceArr.length > 0) {
        const voiceArrFilt = voiceArr.filter(voice => voice.lang.startsWith("ja"))

        paramLi.voiceName = voiceArrFilt[0].name

        gui.add(paramLi, "voiceName", voiceArrFilt.map(voice => voice.name))
        gui.add(paramLi, "marginSec", 0, 5)
        gui.add(paramLi, "rate", 0.5, 3)
        gui.add(paramLi, "pitch", 0, 3)
        gui.add(paramLi, "startNum", 2, 99999, 1)
        gui.add(paramLi, "pause")
    }
}

populateVoiceList()

if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList
}

const startSpeakPrime = p => {
    let curP = p

    const speakNum = n => {
        const utterThis = new SpeechSynthesisUtterance(n)
    
        utterThis.voice = voiceArr.find(voice => voice.name === paramLi.voiceName)
    
        utterThis.pitch = paramLi.pitch
        utterThis.rate = paramLi.rate

        utterThis.onerror = evt => {
            console.error("SpeechSynthesisUtterance.onerror: ", evt)
        }
    
        synth.speak(utterThis)

        return utterThis
    }

    const endHandler = async _evt => {
        console.log("SpeechSynthesisUtterance.onend")

        curP = findNextPrime(curP)

        await new Promise(resolve => setTimeout(resolve, paramLi.marginSec * 1000))

        await new Promise(resolve => {
            const wait = _ => (!paramLi.pause) ? resolve() : requestAnimationFrame(wait)

            wait()
        })

        if (isContinue) {
            const u = speakNum(curP)

            utterPrev = u
    
            u.onend = endHandler
        }
    }

    if (isContinue) {
        const u = speakNum(p)

        utterPrev = u

        u.onend = endHandler
    }
}

const stopSpeakPrime = _ => {
    if (utterPrev) {
        utterPrev.onend = null
    }
}

document.querySelector("button[value='stop']").style.display = "none"

document.querySelector("button[value='stop']").addEventListener("click", _ => {
    isContinue = false

    stopSpeakPrime()

    document.querySelector("button[value='stop']").style.display = "none"
    document.querySelector("button[value='start']").style.display = "inline-block"
})

document.querySelector("button[value='start']").addEventListener("click", _ => {
    isContinue = true

    startSpeakPrime(findNextPrime(paramLi.startNum - 1))

    document.querySelector("button[value='start']").style.display = "none"
    document.querySelector("button[value='stop']").style.display = "inline-block"
})
