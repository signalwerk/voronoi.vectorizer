npm run cli -- \
    --input '__DEMO/a_.2.png' \
    --output '__DEMO/a_.2_full.svg' \
    --seed-density 90000 \
    --seed-value '12345' \
    --seed-strategy aspect \
    --show-cells true \
    --show-voronoi true \
    --show-seeds true \
    --scale 1



npm run cli -- \
    --input '__DEMO/a_.2.png' \
    --output '__DEMO/a_.2_small.svg' \
    --seed-density 90000 \
    --seed-value '12345' \
    --seed-strategy aspect \
    --show-cells true \
    --show-voronoi false \
    --show-seeds false \
    --black-and-white-cells true \
    --skip-white-cells true \
    --combine-same-color-cells true \
    --path-simplification-algorithm rdp \
    --path-simplification-strength 0.7 \
    --path-simplification-size-compensation true \
    --path-simplification-min-path-size01 0.03 \
    --scale 1

npm run cli -- \
    --input '__DEMO/a_.4.png' \
    --output '__DEMO/a_.4_small.svg' \
    --seed-density 90000 \
    --seed-value '12345' \
    --seed-strategy aspect \
    --show-cells true \
    --show-voronoi false \
    --show-seeds false \
    --black-and-white-cells true \
    --skip-white-cells true \
    --combine-same-color-cells true \
    --path-simplification-algorithm rdp \
    --path-simplification-strength 0.7 \
    --path-simplification-size-compensation true \
    --path-simplification-min-path-size01 0.03 \
    --scale 1
