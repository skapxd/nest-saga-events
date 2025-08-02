# Saga Event Documentation

## Event Flow

```mermaid
graph TD;

    classDef emitterStyle fill:#d4edda,stroke:#c3e6cb,color:#155724
    classDef handlerStyle fill:#d1ecf1,stroke:#bee5eb,color:#0c5460
    classDef listenerStyle fill:#fff3cd,stroke:#ffeeba,color:#856404
    classDef eventStyle fill:#f8d7da,stroke:#f5c6cb,color:#721c24,stroke-width:2px,font-weight:bold
    classDef gateStyle fill:#e2e3e5,stroke:#d6d8db,color:#383d41

    subgraph "Flujo de Eventos"
        N0_UserService.createUser["UserService.createUser"]
        N1_UserService.methodThatReturnsBuffer["UserService.methodThatReturnsBuffer"]
        N2_OrderService.placeOrder["OrderService.placeOrder"]
        N3_InventoryService.handleOrderPlacement["InventoryService.handleOrderPlacement"]
        N4_PaymentService.handleInventoryReserved["PaymentService.handleInventoryReserved"]
        N5_VideoService.processUploadedVideo["VideoService.processUploadedVideo"]
        N6_TranscodingService.handleVideoUploaded["TranscodingService.handleVideoUploaded"]
        N7_ThumbnailService.handleVideoUploaded["ThumbnailService.handleVideoUploaded"]
        N8_VerificationService.verifyVideoProcessing["VerificationService.verifyVideoProcessing"]
        N9_PublisherService.publishVideo["PublisherService.publishVideo"]
        N10_NotificationService.handleUserCreatedSuccess["NotificationService.handleUserCreatedSuccess"]
        N11_NotificationService.handleUserCreatedFailure["NotificationService.handleUserCreatedFailure"]
        N12_NotificationService.handleOrderConfirmed["NotificationService.handleOrderConfirmed"]
        N13_NotificationService.handleInventoryFailure["NotificationService.handleInventoryFailure"]
        N14_NotificationService.handlePaymentFailure["NotificationService.handlePaymentFailure"]
        N15_InventoryService.handlePaymentFailure["InventoryService.handlePaymentFailure"]
        N16_user.creation.init(["user.creation.init"])
        N17_user.created.success(["user.created.success"])
        N18_user.created.failure(["user.created.failure"])
        N19_user.buffer.success(["user.buffer.success"])
        N20_user.buffer.failure(["user.buffer.failure"])
        N21_order.placement.init(["order.placement.init"])
        N22_order.confirmed.success(["order.confirmed.success"])
        N23_order.placement.failed(["order.placement.failed"])
        N24_inventory.reserved.success(["inventory.reserved.success"])
        N25_inventory.reserved.failure(["inventory.reserved.failure"])
        N26_payment.processed.success(["payment.processed.success"])
        N27_payment.processed.failure(["payment.processed.failure"])
        N28_video.uploaded(["video.uploaded"])
        N29_video.upload.failed(["video.upload.failed"])
        N30_video.transcoded.success(["video.transcoded.success"])
        N31_video.transcoded.failure(["video.transcoded.failure"])
        N32_thumbnail.generated.success(["thumbnail.generated.success"])
        N33_thumbnail.generated.failure(["thumbnail.generated.failure"])
        N34_video.ready.to.publish(["video.ready.to.publish"])
        N35_video.verification.failed(["video.verification.failed"])
        N36_video.published.success(["video.published.success"])
        N37_video.published.failure(["video.published.failure"])

        N0_UserService.createUser -- Emite --> N16_user.creation.init
        N0_UserService.createUser -- Emite --> N17_user.created.success
        N0_UserService.createUser -- Emite --> N18_user.created.failure
        N1_UserService.methodThatReturnsBuffer -- Emite --> N19_user.buffer.success
        N1_UserService.methodThatReturnsBuffer -- Emite --> N20_user.buffer.failure
        N2_OrderService.placeOrder -- Emite --> N21_order.placement.init
        N2_OrderService.placeOrder -- Emite --> N22_order.confirmed.success
        N2_OrderService.placeOrder -- Emite --> N23_order.placement.failed
        N3_InventoryService.handleOrderPlacement -- Emite --> N24_inventory.reserved.success
        N3_InventoryService.handleOrderPlacement -- Emite --> N25_inventory.reserved.failure
        N4_PaymentService.handleInventoryReserved -- Emite --> N26_payment.processed.success
        N4_PaymentService.handleInventoryReserved -- Emite --> N27_payment.processed.failure
        N5_VideoService.processUploadedVideo -- Emite --> N28_video.uploaded
        N5_VideoService.processUploadedVideo -- Emite --> N29_video.upload.failed
        N6_TranscodingService.handleVideoUploaded -- Emite --> N30_video.transcoded.success
        N6_TranscodingService.handleVideoUploaded -- Emite --> N31_video.transcoded.failure
        N7_ThumbnailService.handleVideoUploaded -- Emite --> N32_thumbnail.generated.success
        N7_ThumbnailService.handleVideoUploaded -- Emite --> N33_thumbnail.generated.failure
        N8_VerificationService.verifyVideoProcessing -- Emite --> N34_video.ready.to.publish
        N8_VerificationService.verifyVideoProcessing -- Emite --> N35_video.verification.failed
        N9_PublisherService.publishVideo -- Emite --> N36_video.published.success
        N9_PublisherService.publishVideo -- Emite --> N37_video.published.failure
        N17_user.created.success -. Dispara .-> N10_NotificationService.handleUserCreatedSuccess
        N18_user.created.failure -. Dispara .-> N11_NotificationService.handleUserCreatedFailure
        N22_order.confirmed.success -. Dispara .-> N12_NotificationService.handleOrderConfirmed
        N25_inventory.reserved.failure -. Dispara .-> N13_NotificationService.handleInventoryFailure
        N27_payment.processed.failure -. Dispara .-> N14_NotificationService.handlePaymentFailure
        N21_order.placement.init -. Dispara .-> N3_InventoryService.handleOrderPlacement
        N27_payment.processed.failure -. Dispara .-> N15_InventoryService.handlePaymentFailure
        N24_inventory.reserved.success -. Dispara .-> N4_PaymentService.handleInventoryReserved
        N28_video.uploaded -. Dispara .-> N6_TranscodingService.handleVideoUploaded
        N28_video.uploaded -. Dispara .-> N7_ThumbnailService.handleVideoUploaded
        N30_video.transcoded.success -. Dispara .-> N8_VerificationService.verifyVideoProcessing
        N32_thumbnail.generated.success -. Dispara .-> N8_VerificationService.verifyVideoProcessing
        N34_video.ready.to.publish -. Dispara .-> N9_PublisherService.publishVideo
    end

    subgraph Leyenda
        direction LR
        N38_Emisor__Inicia_un_proceso_de_negocio_o__Saga__["Emisor (Inicia un proceso de negocio o 'Saga')"]
        N39_Manejador__Recibe_un_evento_y_emite_otros_para_continuar_el_flujo_["Manejador (Recibe un evento y emite otros para continuar el flujo)"]
        N40_Receptor__Recibe_un_evento_y_finaliza_una_rama_del_flujo__ej__notificar_["Receptor (Recibe un evento y finaliza una rama del flujo, ej: notificar)"]
        N41_Evento__Mensaje_que_representa_un_hecho_ocurrido_en_el_sistema_(("Evento (Mensaje que representa un hecho ocurrido en el sistema)"))
        N42_Compuerta_L_gica__Espera_varios_eventos_antes_de_continuar_["Compuerta Lógica (Espera varios eventos antes de continuar)"]
        subgraph "Relaciones"
            direction LR
            N43_A( ) -- Emite --> N44_B( )
            N45_C( ) -. Dispara .-> N46_D( )
        end
    end

    class N0_UserService.createUser,N1_UserService.methodThatReturnsBuffer,N2_OrderService.placeOrder,N5_VideoService.processUploadedVideo emitterStyle
    class N3_InventoryService.handleOrderPlacement,N4_PaymentService.handleInventoryReserved,N6_TranscodingService.handleVideoUploaded,N7_ThumbnailService.handleVideoUploaded,N8_VerificationService.verifyVideoProcessing,N9_PublisherService.publishVideo handlerStyle
    class N10_NotificationService.handleUserCreatedSuccess,N11_NotificationService.handleUserCreatedFailure,N12_NotificationService.handleOrderConfirmed,N13_NotificationService.handleInventoryFailure,N14_NotificationService.handlePaymentFailure,N15_InventoryService.handlePaymentFailure listenerStyle
    class N16_user.creation.init,N17_user.created.success,N18_user.created.failure,N19_user.buffer.success,N20_user.buffer.failure,N21_order.placement.init,N22_order.confirmed.success,N23_order.placement.failed,N24_inventory.reserved.success,N25_inventory.reserved.failure,N26_payment.processed.success,N27_payment.processed.failure,N28_video.uploaded,N29_video.upload.failed,N30_video.transcoded.success,N31_video.transcoded.failure,N32_thumbnail.generated.success,N33_thumbnail.generated.failure,N34_video.ready.to.publish,N35_video.verification.failed,N36_video.published.success,N37_video.published.failure eventStyle
    class N38_Emisor__Inicia_un_proceso_de_negocio_o__Saga__ emitterStyle
    class N39_Manejador__Recibe_un_evento_y_emite_otros_para_continuar_el_flujo_ handlerStyle
    class N40_Receptor__Recibe_un_evento_y_finaliza_una_rama_del_flujo__ej__notificar_ listenerStyle
    class N41_Evento__Mensaje_que_representa_un_hecho_ocurrido_en_el_sistema_ eventStyle
    class N42_Compuerta_L_gica__Espera_varios_eventos_antes_de_continuar_ gateStyle
    click N16_user.creation.init "#usercreationinit" "Go to user.creation.init details"
    click N17_user.created.success "#usercreatedsuccess" "Go to user.created.success details"
    click N18_user.created.failure "#usercreatedfailure" "Go to user.created.failure details"
    click N19_user.buffer.success "#userbuffersuccess" "Go to user.buffer.success details"
    click N20_user.buffer.failure "#userbufferfailure" "Go to user.buffer.failure details"
    click N21_order.placement.init "#orderplacementinit" "Go to order.placement.init details"
    click N22_order.confirmed.success "#orderconfirmedsuccess" "Go to order.confirmed.success details"
    click N23_order.placement.failed "#orderplacementfailed" "Go to order.placement.failed details"
    click N24_inventory.reserved.success "#inventoryreservedsuccess" "Go to inventory.reserved.success details"
    click N25_inventory.reserved.failure "#inventoryreservedfailure" "Go to inventory.reserved.failure details"
    click N26_payment.processed.success "#paymentprocessedsuccess" "Go to payment.processed.success details"
    click N27_payment.processed.failure "#paymentprocessedfailure" "Go to payment.processed.failure details"
    click N28_video.uploaded "#videouploaded" "Go to video.uploaded details"
    click N29_video.upload.failed "#videouploadfailed" "Go to video.upload.failed details"
    click N30_video.transcoded.success "#videotranscodedsuccess" "Go to video.transcoded.success details"
    click N31_video.transcoded.failure "#videotranscodedfailure" "Go to video.transcoded.failure details"
    click N32_thumbnail.generated.success "#thumbnailgeneratedsuccess" "Go to thumbnail.generated.success details"
    click N33_thumbnail.generated.failure "#thumbnailgeneratedfailure" "Go to thumbnail.generated.failure details"
    click N34_video.ready.to.publish "#videoreadytopublish" "Go to video.ready.to.publish details"
    click N35_video.verification.failed "#videoverificationfailed" "Go to video.verification.failed details"
    click N36_video.published.success "#videopublishedsuccess" "Go to video.published.success details"
    click N37_video.published.failure "#videopublishedfailure" "Go to video.published.failure details"
```

## Event Catalog

### `user.creation.init`

**Description**: No description provided.

**Emitted By**:
- `UserService.createUser`

---
### `user.created.success`

**Description**: No description provided.

**Emitted By**:
- `UserService.createUser`

**Listened By**:
- `NotificationService.handleUserCreatedSuccess`

---
### `user.created.failure`

**Description**: No description provided.

**Emitted By**:
- `UserService.createUser`

**Listened By**:
- `NotificationService.handleUserCreatedFailure`

---
### `user.buffer.success`

**Description**: No description provided.

**Emitted By**:
- `UserService.methodThatReturnsBuffer`

---
### `user.buffer.failure`

**Description**: No description provided.

**Emitted By**:
- `UserService.methodThatReturnsBuffer`

---
### `order.placement.init`

**Description**: Starts the order placement process.

**Emitted By**:
- `OrderService.placeOrder`

**Listened By**:
- `InventoryService.handleOrderPlacement`

---
### `order.confirmed.success`

**Description**: Fired when the order is fully confirmed and paid.

**Emitted By**:
- `OrderService.placeOrder`

**Listened By**:
- `NotificationService.handleOrderConfirmed`

---
### `order.placement.failed`

**Description**: Fired when any step in the order placement saga fails.

**Emitted By**:
- `OrderService.placeOrder`

---
### `inventory.reserved.success`

**Description**: Fired when stock has been successfully reserved.

**Emitted By**:
- `InventoryService.handleOrderPlacement`

**Listened By**:
- `PaymentService.handleInventoryReserved`

---
### `inventory.reserved.failure`

**Description**: Fired when there is not enough stock.

**Emitted By**:
- `InventoryService.handleOrderPlacement`

**Listened By**:
- `NotificationService.handleInventoryFailure`

---
### `payment.processed.success`

**Description**: Fired when the payment is successfully processed.

**Emitted By**:
- `PaymentService.handleInventoryReserved`

---
### `payment.processed.failure`

**Description**: Fired when the payment is rejected.

**Emitted By**:
- `PaymentService.handleInventoryReserved`

**Listened By**:
- `NotificationService.handlePaymentFailure`
- `InventoryService.handlePaymentFailure`

---
### `video.uploaded`

**Description**: Fired when a video is uploaded and ready for processing.

**Emitted By**:
- `VideoService.processUploadedVideo`

**Listened By**:
- `TranscodingService.handleVideoUploaded`
- `ThumbnailService.handleVideoUploaded`

---
### `video.upload.failed`

**Description**: Fired if the initial video upload processing fails.

**Emitted By**:
- `VideoService.processUploadedVideo`

---
### `video.transcoded.success`

**Description**: Fired when video transcoding is complete.

**Emitted By**:
- `TranscodingService.handleVideoUploaded`

**Listened By**:
- `VerificationService.verifyVideoProcessing`

---
### `video.transcoded.failure`

**Description**: Fired if video transcoding fails.

**Emitted By**:
- `TranscodingService.handleVideoUploaded`

---
### `thumbnail.generated.success`

**Description**: Fired when a video thumbnail is generated.

**Emitted By**:
- `ThumbnailService.handleVideoUploaded`

**Listened By**:
- `VerificationService.verifyVideoProcessing`

---
### `thumbnail.generated.failure`

**Description**: Fired if thumbnail generation fails.

**Emitted By**:
- `ThumbnailService.handleVideoUploaded`

---
### `video.ready.to.publish`

**Description**: Fired when all video processing steps are confirmed to be complete.

**Emitted By**:
- `VerificationService.verifyVideoProcessing`

**Listened By**:
- `PublisherService.publishVideo`

---
### `video.verification.failed`

**Description**: Fired if the verification process fails.

**Emitted By**:
- `VerificationService.verifyVideoProcessing`

---
### `video.published.success`

**Description**: Fired when the video is fully processed and published.

**Emitted By**:
- `PublisherService.publishVideo`

---
### `video.published.failure`

**Description**: Fired if the final publishing step fails.

**Emitted By**:
- `PublisherService.publishVideo`

---
