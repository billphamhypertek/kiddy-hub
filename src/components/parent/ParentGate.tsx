import { useState } from 'react';

interface Problem {
  a: number;
  b: number;
}

function randomProblem(): Problem {
  return { a: 2 + Math.floor(Math.random() * 8), b: 2 + Math.floor(Math.random() * 8) };
}

interface Props {
  onPass: () => void;
  makeProblem?: () => Problem;
}

export function ParentGate({ onPass, makeProblem = randomProblem }: Props) {
  const [problem, setProblem] = useState<Problem>(makeProblem);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  function check() {
    if (Number(value) === problem.a + problem.b) {
      onPass();
    } else {
      setError(true);
      setValue('');
      setProblem(makeProblem());
    }
  }

  return (
    <div className="screen parent-gate">
      <h2>Khu vực dành cho bố mẹ</h2>
      <p>
        Giải nhanh:{' '}
        <strong>
          {problem.a} + {problem.b} = ?
        </strong>
      </p>
      <input
        aria-label="Đáp án"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={check}>Vào</button>
      {error && <p role="alert">Chưa đúng, thử lại nhé.</p>}
    </div>
  );
}
