import { Applications } from './applications';
import { Datasets } from './datasets';

export default function Home() {
  return (
    <div className="size-full overflow-auto px-5 py-3">
      <article>
        <Datasets />
        <Applications />
      </article>
    </div>
  );
}
