npm run cli -- \
    --input '__DEMO/a_.2.png' \
    --output '__DEMO/a_.2_full.svg' \
    --seed-density 86340 \
    --seed-value '12345' \
    --seed-strategy aspect \
    --show-cells true \
    --show-voronoi true \
    --show-seeds true \
    --scale 1



npm run cli -- \
    --input '__DEMO/a_.2.png' \
    --output '__DEMO/a_.2_small.svg' \
    --seed-density 81700 \
    --seed-value '12345' \
    --seed-strategy aspect \
    --show-cells true \
    --show-voronoi false \
    --show-seeds false \
    --black-and-white-cells false \
    --skip-white-cells true \
    --combine-same-color-cells true \
    --scale 1
