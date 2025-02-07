import { DimItem } from 'app/inventory/item-types';
import { createItemContextSelector } from 'app/inventory/selectors';
import { makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { useD2Definitions } from 'app/manifest/selectors';
import { chainComparator, compareBy } from 'app/utils/comparators';
import { VendorItemDisplay } from 'app/vendors/VendorItemComponent';
import clsx from 'clsx';
import _ from 'lodash';
import { useSelector } from 'react-redux';
import { AppIcon, collapseIcon, expandIcon } from '../shell/icons';
import { count } from '../utils/util';
import CollectiblesGrid from './CollectiblesGrid';
import { PresentationNodeProgress, PresentationNodeTitle } from './PresentationNode';

const plugSetOrder = chainComparator<DimItem>(
  compareBy((i) => i.tier),
  compareBy((i) => i.name)
);

interface Props {
  plugSetCollection: {
    hash: number;
    displayItem: number;
  };
  unlockedItems: Set<number>;
  path: number[];
  onNodePathSelected: (nodePath: number[]) => void;
}

/**
 * A single plug set.
 */
export default function PlugSet({
  plugSetCollection,
  unlockedItems,
  path,
  onNodePathSelected,
}: Props) {
  const defs = useD2Definitions()!;
  const plugSetHash = plugSetCollection.hash;
  const plugSetDef = defs.PlugSet.get(plugSetHash);
  const itemCreationContext = useSelector(createItemContextSelector);

  const plugSetItems = _.compact(
    plugSetDef.reusablePlugItems.map((i) => makeFakeItem(itemCreationContext, i.plugItemHash))
  );

  plugSetItems.sort(plugSetOrder);

  const acquired = count(plugSetItems, (i) => unlockedItems.has(i.hash));
  const childrenExpanded = path.includes(plugSetHash);
  const displayItem = defs.InventoryItem.get(plugSetCollection.displayItem);

  const title = <PresentationNodeTitle def={displayItem} />;

  return (
    <div className="presentation-node">
      <div
        className={clsx('title', { collapsed: !childrenExpanded })}
        onClick={() => onNodePathSelected(childrenExpanded ? [] : [plugSetHash])}
      >
        <span className="collapse-handle">
          <AppIcon className="collapse-icon" icon={childrenExpanded ? collapseIcon : expandIcon} />{' '}
          {title}
        </span>
        <PresentationNodeProgress acquired={acquired} visible={plugSetItems.length} />
      </div>
      {childrenExpanded && (
        <CollectiblesGrid className="plugset">
          {plugSetItems.map((item) => (
            <VendorItemDisplay
              key={item.index}
              item={item}
              unavailable={!unlockedItems.has(item.hash)}
              owned={false}
            />
          ))}
        </CollectiblesGrid>
      )}
    </div>
  );
}
