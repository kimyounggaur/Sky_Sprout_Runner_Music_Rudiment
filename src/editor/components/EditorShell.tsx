import type { LevelObject } from '../../game/data/LevelData';
import type { CatalogCategory } from '../data/objectCatalog';
import type { EditorState, ValidationResult } from '../schemas/levelDefaults';
import type { Alignment, DistributionAxis } from '../systems/EditorAdvancedTools';
import { DifficultyEstimatorPanel } from './DifficultyEstimatorPanel';
import { EditorToolbar } from './EditorToolbar';
import { LayerPanel } from './LayerPanel';
import { MiniMap } from './MiniMap';
import { MobileEditorControls } from './MobileEditorControls';
import { PalettePanel } from './PalettePanel';
import { PropertiesPanel } from './PropertiesPanel';
import { ValidationPanel } from './ValidationPanel';

interface EditorShellProps {
  state: EditorState;
  saveStatus: 'Saved' | 'Unsaved' | 'Autosaved';
  activeCategory: CatalogCategory;
  selectedObject: LevelObject | null;
  canUndo: boolean;
  canRedo: boolean;
  canvasRef: (node: HTMLDivElement | null) => void;
  onBack: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTest: () => void;
  onValidate: () => void;
  onExport: () => void;
  onSettings: () => void;
  onHelp: () => void;
  onMusic: () => void;
  onCategoryChange: (category: CatalogCategory) => void;
  onPaletteItem: (itemId: string) => void;
  onPropertyChange: (id: string, changes: Partial<LevelObject>) => void;
  onMultiPropertyChange: (changes: Partial<LevelObject>) => void;
  onAlign: (alignment: Alignment) => void;
  onDistribute: (axis: DistributionAxis) => void;
  onLayerChange: Parameters<typeof LayerPanel>[0]['onChange'];
  onFocusPoint: (point: { x: number; y: number }) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFocusResult: (result: ValidationResult) => void;
}

export function EditorShell(props: EditorShellProps) {
  return (
    <section className="editor-root">
      <header className="editor-title">
        <h1>Sky Forge Editor</h1>
      </header>
      <EditorToolbar
        state={props.state}
        saveStatus={props.saveStatus}
        canUndo={props.canUndo}
        canRedo={props.canRedo}
        onBack={props.onBack}
        onSave={props.onSave}
        onUndo={props.onUndo}
        onRedo={props.onRedo}
        onTest={props.onTest}
        onValidate={props.onValidate}
        onExport={props.onExport}
        onSettings={props.onSettings}
        onHelp={props.onHelp}
        onMusic={props.onMusic}
      />
      <div className="editor-workbench">
        <PalettePanel
          activeCategory={props.activeCategory}
          activeItemId={props.state.activePaletteItemId}
          onCategoryChange={props.onCategoryChange}
          onItemChange={props.onPaletteItem}
        />
        <LayerPanel layers={props.state.layers} onChange={props.onLayerChange} />
        <div className="editor-canvas-wrap">
          <div className="editor-canvas-host" data-testid="editor-canvas-host" ref={props.canvasRef} />
          <MiniMap state={props.state} onFocus={props.onFocusPoint} />
        </div>
        <PropertiesPanel
          state={props.state}
          selectedObject={props.selectedObject}
          onChange={props.onPropertyChange}
          onMultiChange={props.onMultiPropertyChange}
          onAlign={props.onAlign}
          onDistribute={props.onDistribute}
          onDuplicate={props.onDuplicate}
          onDelete={props.onDelete}
        />
        <DifficultyEstimatorPanel level={props.state.level} />
      </div>
      <div className="editor-statusbar">
        <span>
          {Math.round(props.state.camera.zoom * 100)}% zoom
        </span>
        <span>{props.state.selectedIds.length} selected</span>
        <span>{props.state.activeTool}</span>
        <span>{props.state.validationResults.filter((result) => result.severity !== 'info').length} warnings</span>
      </div>
      <ValidationPanel results={props.state.validationResults} onFocusResult={props.onFocusResult} />
      <MobileEditorControls
        onCopy={props.onDuplicate}
        onDelete={props.onDelete}
        onSave={props.onSave}
        onTest={props.onTest}
      />
    </section>
  );
}
