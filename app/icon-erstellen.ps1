param([string]$Ziel = (Join-Path $PSScriptRoot 'icon.ico'))
# Baut das App-Symbol icon.ico: weißes abgerundetes Quadrat, darauf "f" (klein) und "B" (groß) gleich hoch,
# rechts unten neben dem B ein oranger Punkt (wie im Schriftzug "fabBoard.").
# Aufruf: powershell -File icon-erstellen.ps1   (legt zusätzlich icon-vorschau.png an)
Add-Type -AssemblyName System.Drawing
$schrift = 'Segoe UI Black'
$schwarz = [System.Drawing.Color]::FromArgb(0x1A, 0x1A, 0x1A)
$orange = [System.Drawing.Color]::FromArgb(0xF0, 0x7C, 0x1F)
$rand = [System.Drawing.Color]::FromArgb(0xD8, 0xD8, 0xD4)

# Buchstabe als Umriss, verschoben auf (0,0) und auf Höhe $h skaliert
function Buchstabe($zeichen, $h) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $fam = New-Object System.Drawing.FontFamily $schrift
  $p.AddString($zeichen, $fam, 0, 100, (New-Object System.Drawing.PointF 0, 0), [System.Drawing.StringFormat]::GenericTypographic)
  $b = $p.GetBounds()
  $m = New-Object System.Drawing.Drawing2D.Matrix
  $s = $h / $b.Height
  $m.Scale($s, $s); $m.Translate(-$b.X, -$b.Y)
  $p.Transform($m)
  return $p
}

$groessen = 16, 24, 32, 48, 64, 128, 256
$bilder = @()
foreach ($g in $groessen) {
  $bmp = New-Object System.Drawing.Bitmap $g, $g
  $gr = [System.Drawing.Graphics]::FromImage($bmp)
  $gr.SmoothingMode = 'AntiAlias'
  $gr.Clear([System.Drawing.Color]::Transparent)
  $f = $g / 32.0

  # Hintergrund: weiß, abgerundet, feiner grauer Rand (damit es auf hellem Desktop sichtbar bleibt)
  $r = 7 * $f * 2; $o = 0.5; $e = $g - 1
  $bg = New-Object System.Drawing.Drawing2D.GraphicsPath
  $bg.AddArc($o, $o, $r, $r, 180, 90); $bg.AddArc($e - $r, $o, $r, $r, 270, 90)
  $bg.AddArc($e - $r, $e - $r, $r, $r, 0, 90); $bg.AddArc($o, $e - $r, $r, $r, 90, 90); $bg.CloseFigure()
  $gr.FillPath([System.Drawing.Brushes]::White, $bg)
  $gr.DrawPath((New-Object System.Drawing.Pen $rand, ([Math]::Max(1, $f))), $bg)

  # f und B gleich hoch, Punkt rechts unten neben dem B
  $h = 15.2 * $f
  $pf = Buchstabe 'f' $h; $pb = Buchstabe 'B' $h
  # B etwas schmaler (85 % der normalen Breite)
  $m = New-Object System.Drawing.Drawing2D.Matrix; $m.Scale(0.85, 1); $pb.Transform($m)
  $wf = $pf.GetBounds().Width; $wb = $pb.GetBounds().Width
  $abstand = 1 * $f; $punkt = 4 * $f
  $breite = $wf + $abstand + $wb + $abstand + $punkt
  $x = ($g - $breite) / 2; $y = ($g - $h) / 2
  $pinsel = New-Object System.Drawing.SolidBrush $schwarz
  $m = New-Object System.Drawing.Drawing2D.Matrix; $m.Translate($x, $y); $pf.Transform($m); $gr.FillPath($pinsel, $pf)
  $m = New-Object System.Drawing.Drawing2D.Matrix; $m.Translate($x + $wf + $abstand, $y); $pb.Transform($m); $gr.FillPath($pinsel, $pb)
  $gr.FillEllipse((New-Object System.Drawing.SolidBrush $orange), ($x + $wf + $abstand + $wb + $abstand), ($y + $h - $punkt), $punkt, $punkt)
  $gr.Dispose()

  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $bilder += , $ms.ToArray()
  $bmp.Dispose()
}

# .ico-Datei zusammensetzen (jede Größe als PNG)
$out = New-Object System.IO.MemoryStream
$w = New-Object System.IO.BinaryWriter $out
$w.Write([uint16]0); $w.Write([uint16]1); $w.Write([uint16]$groessen.Count)
$offset = 6 + 16 * $groessen.Count
for ($i = 0; $i -lt $groessen.Count; $i++) {
  $g = $groessen[$i]; $b = if ($g -ge 256) { 0 } else { $g }
  $w.Write([byte]$b); $w.Write([byte]$b); $w.Write([byte]0); $w.Write([byte]0)
  $w.Write([uint16]1); $w.Write([uint16]32)
  $w.Write([uint32]$bilder[$i].Length); $w.Write([uint32]$offset)
  $offset += $bilder[$i].Length
}
foreach ($d in $bilder) { $w.Write($d) }
$w.Flush()
[System.IO.File]::WriteAllBytes($Ziel, $out.ToArray())
[System.IO.File]::WriteAllBytes(($Ziel -replace '\.ico$', '-vorschau.png'), $bilder[-1])
"Erstellt: $Ziel"
