import { useEffect, useRef, useState } from "react";
import { KokoroTTS } from "kokoro-js";
import "./App.css";

const MODEL_ID = "onnx-community/Kokoro-82M-ONNX";
const MAX_CHARS = 1500;

export default function App() {
	const ttsRef = useRef(null);
	const audioUrlRef = useRef(null);

	const [text, setText] = useState(
		"Hello! This voice was generated locally in your browser using Kokoro."
	);
	const [voice, setVoice] = useState("af_bella");
	const [speed, setSpeed] = useState(1);
	const [voices, setVoices] = useState([]);
	const [status, setStatus] = useState(
		"Model not downloaded yet. It runs fully in your browser."
	);
	const [busy, setBusy] = useState(false);
	const [generating, setGenerating] = useState(false);
	const [modelReady, setModelReady] = useState(false);
	const [audioUrl, setAudioUrl] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		return () => {
			if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
		};
	}, []);

	async function loadModel() {
		setBusy(true);
		setError("");
		setStatus("Downloading model for first use...");

		try {
			const tts = await KokoroTTS.from_pretrained(MODEL_ID, {
				dtype: "q8",
				device: "wasm",
				progress_callback: (progress) => {
					if (progress.status !== "progress" || !progress.total) return;
					const pct = Math.round((progress.loaded / progress.total) * 100);
					setStatus(`Downloading model... ${pct}%`);
				},
			});

			ttsRef.current = tts;
			setVoices(
				Object.entries(tts.voices).map(([id, info]) => ({
					id,
					name: info.name,
					language: info.language,
				}))
			);
			setModelReady(true);
			setStatus("Model ready — generation runs locally.");
		} catch (err) {
			console.error(err);
			setError(
				"Could not download the model. Check your connection and try again."
			);
			setStatus("Download failed.");
		} finally {
			setBusy(false);
		}
	}

	function revokeAudio() {
		if (audioUrlRef.current) {
			URL.revokeObjectURL(audioUrlRef.current);
			audioUrlRef.current = null;
		}
		setAudioUrl(null);
	}

	function clearAudio() {
		revokeAudio();
		setStatus("Audio cleared.");
	}

	async function generateSpeech() {
		if (!ttsRef.current || !text.trim()) return;

		setBusy(true);
		setGenerating(true);
		setError("");
		setStatus("Generating audio locally...");

		revokeAudio();

		try {
			const audio = await ttsRef.current.generate(text.trim(), {
				voice,
				speed: Number(speed),
			});

			const blob = audio.toBlob();

			if (audioUrlRef.current) {
				URL.revokeObjectURL(audioUrlRef.current);
			}

			const url = URL.createObjectURL(blob);
			audioUrlRef.current = url;
			setAudioUrl(url);
			setStatus("Done.");
		} catch (err) {
			console.error(err);
			setError("Speech generation failed. Try shorter text or another browser.");
			setStatus("Generation failed.");
		} finally {
			setBusy(false);
			setGenerating(false);
		}
	}

	async function handleClick() {
		if (!modelReady) {
			await loadModel();
		} else {
			await generateSpeech();
		}
	}

	const buttonLabel = busy
		? modelReady
			? "Generating..."
			: "Downloading model..."
		: modelReady
			? "Generate speech"
			: "Download model";

	return (
		<main className="app">
			<header className="header">
				<h1>Kokoro TTS</h1>
				<p className="subtitle">
					Free, local AI speech generation in your browser.
				</p>
			</header>

			<div className="field">
				<div className="field-head">
					<label htmlFor="text">Text</label>
					<span className="field-hint">
						{text.length}/{MAX_CHARS}
					</span>
				</div>
				<textarea
					id="text"
					value={text}
					onChange={(event) => setText(event.target.value)}
					maxLength={MAX_CHARS}
					placeholder="Type something to speak..."
				/>
			</div>

			<div className="controls">
				<div className="field">
					<div className="field-head">
						<label htmlFor="voice">Voice</label>
						<span className="field-hint">
							{voices.length > 0 ? `${voices.length} voices` : "—"}
						</span>
					</div>
					<select
						id="voice"
						value={voice}
						onChange={(event) => setVoice(event.target.value)}
						disabled={!modelReady || busy}
					>
						{voices.map(({ id, name, language }) => (
							<option key={id} value={id}>
								{name} ({language})
							</option>
						))}
					</select>
				</div>

				<div className="field">
					<div className="field-head">
						<label htmlFor="speed">Speed</label>
						<span className="field-hint">{speed}x</span>
					</div>
					<input
						id="speed"
						type="range"
						min="0.7"
						max="1.4"
						step="0.1"
						value={speed}
						onChange={(event) => setSpeed(event.target.value)}
					/>
				</div>
			</div>

			<button
				type="button"
				className="generate"
				onClick={handleClick}
				disabled={busy || (modelReady && !text.trim())}
			>
				{buttonLabel}
			</button>

			<p className="status" aria-live="polite">
				{status}
			</p>
			{error && <p className="error">{error}</p>}

			{(audioUrl || generating) && (
				<section className="result" aria-live="polite">
					{generating ? (
						<div className="generating">
							<span className="spinner" aria-hidden="true" />
							Generating new audio...
						</div>
					) : (
						<>
							<audio controls autoPlay src={audioUrl} />
							<div className="result-actions">
								<a
									className="download"
									href={audioUrl}
									download="kokoro-speech.wav"
								>
									Download WAV
								</a>
								<button type="button" className="clear" onClick={clearAudio}>
									Clear
								</button>
							</div>
						</>
					)}
				</section>
			)}
		</main>
	);
}
